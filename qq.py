import botpy
from botpy.types.message import Message
from botpy.flags import Permission
import asyncio
from aiohttp import web
import aiohttp  # 用于向 Nuxt 回调逐条变更
import json
import threading
import queue
import os

class MyClient(botpy.Client):
    # 存储身份组名称到ID的映射
    role_name_to_id = {}
    # 存储当前频道ID
    current_channel_id = None
    # 存储当前有发言权限的身份组
    current_speaking_roles = set()
    # 永久有发言权限的身份组
    permanent_speaking_roles = {'后台', '主持人'}
    # 身份组名称列表
    role_names = [
        '正方一辩', '正方二辩', '正方三辩', '正方四辩',
        '反方一辩', '反方二辩', '反方三辩', '反方四辩',
        '后台', '主持人', '评委', '观众'
    ]
    # 创建一个线程安全的队列，用于在HTTP服务器和机器人主循环之间传递命令
    command_queue = queue.Queue()
    # 存储身份组已分配的用户
    role_assigned_users = {}
    # 存储身份组的最大人数限制
    role_max_members = {
        '正方一辩': 1, '正方二辩': 1, '正方三辩': 1, '正方四辩': 1,
        '反方一辩': 1, '反方二辩': 1, '反方三辩': 1, '反方四辩': 1,
        '主持人': 2, '评委': 5, '后台': 3, '观众': 100
    }
    # 网关连接状态（on_ready 置为 True）
    is_gateway_connected = False

    async def on_ready(self):
        self.is_gateway_connected = True
        print("QQ机器人已启动，HTTP服务器运行在 http://localhost:8080")
        # 启动命令处理器作为后台任务
        asyncio.create_task(self._command_processor())

    async def _command_processor(self):
        """
        在机器人主事件循环中运行的后台任务。
        它不断地从线程安全队列中获取命令并执行它们。
        这确保了所有的API调用都在正确的循环中执行。
        """
        print("命令处理器已启动。")
        while True:
            try:
                # 从队列中获取命令，不会阻塞事件循环
                command = self.command_queue.get_nowait()
                if command:
                    print(f"收到并处理命令: {command}")
                    action = command.get('action')
                    if action == 'setRolePermission':
                        role_name = command.get('roleName')
                        allow = command.get('allow')
                        try:
                            await self.set_role_permission_internal(role_name, bool(allow))
                        except Exception as e:
                            print(f"设置单个身份组权限失败: {e}")
                    else:
                        stage = command.get('stage')
                        allowed_roles = command.get('allowedRoles', [])
                        await self.set_stage_permissions(stage, allowed_roles)
            except queue.Empty:
                # 队列为空，短暂等待后继续检查
                await asyncio.sleep(0.1)
            except Exception as e:
                print(f"命令处理器发生错误: {e}")
                await asyncio.sleep(1)  # 发生错误时等待更长时间

    async def on_message_create(self, message: Message):
        if not self.current_channel_id:
            self.current_channel_id = message.channel_id
            print(f"已自动设置当前频道ID: {self.current_channel_id}")

        content = message.content.strip()
        
        if content.startswith('允许') or content.startswith('禁止'):
            role_name = next((name for name in self.role_names if name in content), None)
            if role_name:
                await self.set_role_speak_permission(message, role_name, content.startswith('允许'))
                return

        if content == '创建身份组':
            await self.create_all_roles(message)
            return
        
        if content == '删除身份组':
            await self.delete_all_roles(message)
            return
            
        elif content.startswith('我是') and any(role_name in content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in content:
                    role_name = name
                    break
            
            if role_name:
                # 获取频道ID
                guild_id = message.guild_id
                user_id = message.author.id
                
                # 检查身份组是否存在
                if role_name not in self.role_name_to_id:
                    # 改为被动消息并添加引用
                    await self.api.post_message(
                        channel_id=message.channel_id,
                        content=f"身份组 {role_name} 不存在，请先创建身份组",
                        msg_id=message.id,
                        message_reference={"message_id": message.id}
                    )
                else:
                    role_id = self.role_name_to_id[role_name]
                    
                    # 确保role_id在role_assigned_users中存在
                    if role_id not in self.role_assigned_users:
                        self.role_assigned_users[role_id] = set()
                    
                    # 检查该身份组是否已分配用户
                    if user_id in self.role_assigned_users.get(role_id, set()):
                        # 改为被动消息并添加引用
                        await self.api.post_message(
                            channel_id=message.channel_id,
                            content=f"用户 {user_id} 已在身份组 {role_name} 中",
                            msg_id=message.id,
                            message_reference={"message_id": message.id}
                        )
                    else:
                        # 检查用户是否已在其他身份组
                        user_in_other_role = False
                        for rid, users in self.role_assigned_users.items():
                            if user_id in users and rid != role_id:
                                user_in_other_role = True
                                break

                        if user_in_other_role:
                            # 查找用户当前所在的身份组
                            current_role_name = None
                            for r_id, users in self.role_assigned_users.items():
                                if user_id in users:
                                    # 找到role_id对应的role_name
                                    for r_name, r_id_in_dict in self.role_name_to_id.items():
                                        if r_id_in_dict == r_id:
                                            current_role_name = r_name
                                            break
                                    break
                            # 构造提示消息
                            if current_role_name:
                                # 改为被动消息并添加引用
                                await self.api.post_message(
                                    channel_id=message.channel_id,
                                    content=f"您已在身份组 {current_role_name} 中，请先退出当前身份组{current_role_name} 再加入新身份组，退出口令为：我不是{current_role_name}",
                                    msg_id=message.id,
                                    message_reference={"message_id": message.id}
                                )
                            else:
                                # 改为被动消息并添加引用
                                await self.api.post_message(
                                    channel_id=message.channel_id,
                                    content=f"您已在其他身份组中，请先退出当前身份组再加入新身份组",
                                    msg_id=message.id,
                                    message_reference={"message_id": message.id}
                                )
                        else:
                            # 获取该身份组的最大人数限制
                            max_members = self.role_max_members.get(role_name, 1)
                            current_members = len(self.role_assigned_users.get(role_id, set()))

                            if max_members > 0 and current_members >= max_members:
                                # 改为被动消息并添加引用
                                await self.api.post_message(
                                    channel_id=message.channel_id,
                                    content=f"身份组 {role_name} 已达到最大人数限制 ({max_members}人)",
                                    msg_id=message.id,
                                    message_reference={"message_id": message.id}
                                )
                            else:
                                try:
                                    # 调用API添加用户到身份组
                                    await self.api.create_guild_role_member(
                                    guild_id=guild_id,
                                    role_id=role_id,
                                    user_id=user_id
                                )
                                # 更新已分配用户集合
                                    self.role_assigned_users[role_id].add(user_id)
                                    # 改为被动消息并添加引用
                                    await self.api.post_message(
                                        channel_id=message.channel_id,
                                        content=f"成功将用户 {user_id} 添加到身份组 {role_name}",
                                        msg_id=message.id,
                                        message_reference={"message_id": message.id}
                                    )
                                except Exception as e:
                                    # 改为被动消息并添加引用
                                    await self.api.post_message(
                                        channel_id=message.channel_id,
                                        content=f"添加用户到身份组 {role_name} 失败: {str(e)}",
                                        msg_id=message.id,
                                        message_reference={"message_id": message.id}
                                    )
        elif content.startswith('我不是') and any(role_name in content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in content:
                    role_name = name
                    break
                    
            if role_name:
                # 获取频道ID和用户ID
                guild_id = message.guild_id
                user_id = message.author.id
                
                # 检查身份组是否存在
                if role_name not in self.role_name_to_id:
                    await self.api.post_message(
                        channel_id=message.channel_id,
                        content=f"身份组 {role_name} 不存在",
                        msg_id=message.id,
                        message_reference={"message_id": message.id}
                    )
                else:
                    role_id = self.role_name_to_id[role_name]
                    
                    # 检查用户是否在该身份组中
                    if role_id not in self.role_assigned_users or user_id not in self.role_assigned_users[role_id]:
                        await self.api.post_message(
                            channel_id=message.channel_id,
                            content=f"您不在身份组 {role_name} 中",
                            msg_id=message.id,
                            message_reference={"message_id": message.id}
                        )
                    else:
                        try:
                            # 调用API从身份组中移除用户
                            await self.api.delete_guild_role_member(
                                guild_id=guild_id,
                                role_id=role_id,
                                user_id=user_id
                            )
                            # 更新已分配用户集合
                            self.role_assigned_users[role_id].remove(user_id)
                            await self.api.post_message(
                                channel_id=message.channel_id,
                                content=f"成功将用户 {user_id} 从身份组 {role_name} 中移除",
                                msg_id=message.id,
                                message_reference={"message_id": message.id}
                            )
                        except Exception as e:
                            await self.api.post_message(
                                channel_id=message.channel_id,
                                content=f"从身份组 {role_name} 移除用户失败: {str(e)}",
                                msg_id=message.id,
                                message_reference={"message_id": message.id}
                            )

    async def create_all_roles(self, message: Message):
        guild_id = message.guild_id
        await message.reply(content="正在开始创建身份组...")
        colors = [16711680, 65280, 255, 16776960, 8388736, 16711935, 65535, 8421504, 14260633, 10066329, 2631720, 12632256]
        for i, name in enumerate(self.role_names):
            try:
                role = await self.api.create_guild_role(guild_id=guild_id, name=name, color=colors[i], hoist=1)
                role_id = role['role_id']
                self.role_name_to_id[name] = role_id
                # 初始化该身份组的用户集合
                self.role_assigned_users[role_id] = set()
                print(f"成功创建身份组: {name} (ID: {role_id})")
                
                if name in self.permanent_speaking_roles:
                    await self.api.update_channel_role_permissions(
                        channel_id=self.current_channel_id,
                        role_id=role_id,
                        add=Permission(speak_permission=True)
                    )
                    self.current_speaking_roles.add(name)
                    print(f"已为 {name} 设置默认发言权限。")
            except Exception as e:
                print(f"创建身份组 {name} 失败: {e}")
        await message.reply(content="身份组创建完成。")

    async def delete_all_roles(self, message: Message):
        guild_id = message.guild_id
        await message.reply(content="正在开始删除身份组...")
        try:
            roles_response = await self.api.get_guild_roles(guild_id=guild_id)
            guild_roles = {role['name']: role['id'] for role in roles_response.get('roles', [])}
            
            deleted_count = 0
            for name in self.role_names:
                if name in guild_roles:
                    role_id = guild_roles[name]
                    try:
                        await self.api.delete_guild_role(guild_id=guild_id, role_id=role_id)
                        print(f"成功删除身份组: {name} (ID: {role_id})")
                        deleted_count += 1
                    except Exception as e:
                        print(f"删除身份组 {name} 失败: {e}")
            
            self.role_name_to_id.clear()
            self.current_speaking_roles.clear()
            self.role_assigned_users.clear()  # 清空用户分配信息
            await message.reply(content=f"删除流程完成，共删除了 {deleted_count} 个身份组。")
        except Exception as e:
            await message.reply(content=f"删除身份组过程中发生错误: {e}")

    async def _notify_role_applied(self, role_name: str, allowed: bool):
        """
        将单个角色的权限变更逐条回调给 Nuxt，以便 WS 立刻按角色增量广播。
        """
        try:
            async with aiohttp.ClientSession() as session:
                base = os.environ.get('NUXT_CALLBACK_BASE', 'http://localhost:3000')
                url = f"{base.rstrip('/')}/api/qq-bot/role-applied"
                await session.post(
                    url,
                    json={'roleName': role_name, 'allowed': bool(allowed)},
                    timeout=aiohttp.ClientTimeout(total=3)
                )
        except Exception as e:
            # 回调失败不影响主流程
            print(f"回调 Nuxt 失败(role-applied): {e}")

    async def set_role_permission_internal(self, role_name: str, allow_speak: bool):
        """
        供HTTP命令调用的内部方法，不依赖Message对象。
        """
        role_id = self.role_name_to_id.get(role_name)
        if not role_id:
            raise ValueError(f"未找到身份组: {role_name}")

        try:
            permission_update = {'add' if allow_speak else 'remove': Permission(speak_permission=True)}
            await self.api.update_channel_role_permissions(channel_id=self.current_channel_id, role_id=role_id, **permission_update)

            if allow_speak:
                self.current_speaking_roles.add(role_name)
            else:
                self.current_speaking_roles.discard(role_name)
            print(f"内部操作成功: 已{'允许' if allow_speak else '禁止'}身份组 {role_name} 发言。")
            # 逐条回调前端进行增量变色
            asyncio.create_task(self._notify_role_applied(role_name, allow_speak))
        except Exception as e:
            raise RuntimeError(f"内部操作失败: {e}")

    async def set_role_speak_permission(self, message: Message, role_name: str, allow_speak: bool):
        role_id = self.role_name_to_id.get(role_name)
        if not role_id:
            await message.reply(content=f"未找到身份组: {role_name}")
            return
        
        try:
            permission_update = {'add' if allow_speak else 'remove': Permission(speak_permission=True)}
            await self.api.update_channel_role_permissions(channel_id=message.channel_id, role_id=role_id, **permission_update)
            
            if allow_speak: self.current_speaking_roles.add(role_name)
            else: self.current_speaking_roles.discard(role_name)
            
            await message.reply(content=f"操作成功: 已{'允许' if allow_speak else '禁止'}身份组 {role_name} 发言。")
        except Exception as e:
            await message.reply(content=f"操作失败: {e}")

    async def set_stage_permissions(self, stage: int, allowed_roles: list):
        print(f"\\n--- 正在为环节 {stage} 设置权限 ---")
        if not self.current_channel_id:
            print("错误: 未设置频道ID，无法设置权限")
            return False

        target_roles = set(allowed_roles) | self.permanent_speaking_roles
        roles_to_revoke = self.current_speaking_roles - target_roles
        roles_to_grant = target_roles - self.current_speaking_roles
        
        print(f"当前权限: {list(self.current_speaking_roles)}")
        print(f"目标权限: {list(target_roles)}")
        print(f"需要撤销: {list(roles_to_revoke)}")
        print(f"需要赋予: {list(roles_to_grant)}")

        # 固定批量更新顺序：正方先、反方后；一辩先、四辩后；评委在观众之前；主持人与后台优先
        role_order = ['主持人','后台','评委','正方一辩','正方二辩','正方三辩','正方四辩','反方一辩','反方二辩','反方三辩','反方四辩','观众']
        def role_sort_key(name):
            try:
                return role_order.index(name)
            except ValueError:
                return len(role_order)

        all_succeeded = True
        for role_name in sorted(roles_to_revoke, key=role_sort_key):
            role_id = self.role_name_to_id.get(role_name)
            if role_id:
                try:
                    await self.api.update_channel_role_permissions(self.current_channel_id, role_id=role_id, remove=Permission(speak_permission=True))
                    print(f"✅ 成功撤销 {role_name} 的权限")
                    # 逐条回调
                    asyncio.create_task(self._notify_role_applied(role_name, False))
                except Exception as e:
                    print(f"❌ 撤销 {role_name} 权限失败: {e}")
                    all_succeeded = False
        
        for role_name in sorted(roles_to_grant, key=role_sort_key):
            role_id = self.role_name_to_id.get(role_name)
            if role_id:
                try:
                    await self.api.update_channel_role_permissions(self.current_channel_id, role_id=role_id, add=Permission(speak_permission=True))
                    print(f"✅ 成功赋予 {role_name} 的权限")
                    # 逐条回调
                    asyncio.create_task(self._notify_role_applied(role_name, True))
                except Exception as e:
                    print(f"❌ 赋予 {role_name} 权限失败: {e}")
                    all_succeeded = False
        
        self.current_speaking_roles = target_roles
        print(f"--- 环节 {stage} 权限设置完成 ---")
        print(f"最终权限: {list(self.current_speaking_roles)}\\n")
        return all_succeeded

    def start_http_server(self):
        async def handle_set_permissions(request):
            try:
                data = await request.json()
                self.command_queue.put(data)
                return web.json_response({'success': True, 'message': 'Command received and queued for processing.'})
            except Exception as e:
                print(f"HTTP request error: {e}")
                return web.json_response({'success': False, 'message': f'Error receiving command: {e}'}, status=500)

        async def handle_get_status(request):
            return web.json_response({
                'connected': bool(self.is_gateway_connected),
                'channel_ready': bool(self.current_channel_id),
                'current_speaking_roles': list(self.current_speaking_roles),
                'role_mappings': self.role_name_to_id,
                'channel_id': self.current_channel_id
            })

        async def handle_set_role_permission(request):
            try:
                data = await request.json()
                role_name = data.get('roleName')
                allow = data.get('allow')
                if role_name is None or allow is None:
                    return web.json_response({'success': False, 'message': 'roleName和allow为必填参数'}, status=400)
                # 加入命令队列，由机器人循环统一执行
                self.command_queue.put({'action': 'setRolePermission', 'roleName': role_name, 'allow': allow})
                return web.json_response({'success': True, 'message': 'Toggle queued'})
            except Exception as e:
                print(f"HTTP request error (/set-role-permission): {e}")
                return web.json_response({'success': False, 'message': f'Error: {e}'}, status=500)

        app = web.Application()
        app.router.add_post('/set-stage-permissions', handle_set_permissions)
        app.router.add_post('/set-role-permission', handle_set_role_permission)
        app.router.add_get('/status', handle_get_status)
        
        def run_server():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            web.run_app(app, host='localhost', port=8080)
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        print("HTTP服务器已启动在 http://localhost:8080")

if __name__ == '__main__':
    intents = botpy.Intents(guild_messages=True, guilds=True) 
    client = MyClient(intents=intents)
    client.start_http_server()
    client.run('102035721','ir09IRajt3DNXhr2DOZkv6IUgs4GSer4')