import botpy
from botpy.types.message import Message
from botpy.flags import Permission

class MyClient(botpy.Client):
    # 存储创建的辩论身份组ID
    debate_role_ids = []
    # 存储身份组名称到ID的映射
    role_name_to_id = {}
    # 存储每个身份组已分配的用户ID
    role_assigned_users = {}

    # 身份组名称列表
    role_names = [
        '正方一辩', '正方二辩', '正方三辩', '正方四辩',
        '反方一辩', '反方二辩', '反方三辩', '反方四辩',
        '后台', '主持人', '评委'
    ]
    
    # 定义每个身份组的最大人数限制 (0表示无限制)
    role_max_members = {
        '正方一辩': 1,
        '正方二辩': 1,
        '正方三辩': 1,
        '正方四辩': 1,
        '反方一辩': 1,
        '反方二辩': 1,
        '反方三辩': 1,
        '反方四辩': 1,
        '后台': 1,
        '主持人': 2,
        '评委': 0
    }

    async def on_message_create(self, message: Message):
        # 先等待权限获取完成
        print(await self.api.get_channel_user_permissions(channel_id=message.channel_id, user_id=message.author.id))
        # 创建Permission对象，设置发言权限
        # 使用Permission类设置发言权限
        # 根据QQ文档，发言权限的值为4 (1 << 2)
        # 设置身份组发言权限的命令
        if message.content.startswith('允许') and any(role_name in message.content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in message.content:
                    role_name = name
                    break
            
            if role_name:
                await self.set_role_speak_permission(message, role_name, True)
        
        elif message.content.startswith('禁止') and any(role_name in message.content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in message.content:
                    role_name = name
                    break
            
            if role_name:
                await self.set_role_speak_permission(message, role_name, False)
        
        # 保留原有的个人权限设置命令，但添加提示
        elif '1' in message.content:
            # 改为被动消息并添加引用
            await self.api.post_message(
                channel_id=message.channel_id,
                content="请使用'允许[身份组名称]'命令来设置身份组发言权限",
                msg_id=message.id,
                message_reference={"message_id": message.id}
            )
        elif '2' in message.content:
            # 改为被动消息并添加引用
            await self.api.post_message(
                channel_id=message.channel_id,
                content="请使用'禁止[身份组名称]'命令来设置身份组发言权限",
                msg_id=message.id,
                message_reference={"message_id": message.id}
            )
        elif '3' in message.content:
            # 获取频道ID
            guild_id = message.guild_id
            
            # 使用类定义的身份组名称列表
            role_names = self.role_names
            
            # 为不同身份组设置不同颜色（ARGB的HEX十六进制颜色值转换后的十进制数值）
            colors = [
                16711680,  # 红色
                65280,      # 绿色
                255,        # 蓝色
                16776960,   # 黄色
                8388736,    # 紫色
                16711935,   # 粉色
                65535,      # 青色
                8421504,    # 灰色
                14260633,   # 橙色 (后台)
                10066329,   # 深蓝色 (主持人)
                2631720     # 浅绿色 (评委)
            ]
            
            # 循环创建身份组
            for i, name in enumerate(role_names):
                try:
                    role = await self.api.create_guild_role(
                        guild_id=guild_id,
                        name=name,
                        color=colors[i],
                        hoist=1  # 在成员列表中单独展示
                    )
                    print(f"成功创建身份组: {name}, ID: {role['role_id']}")
                    # 保存身份组ID
                    self.debate_role_ids.append(role['role_id'])
                    # 存储身份组名称到ID的映射
                    self.role_name_to_id[name] = role['role_id']
                    # 初始化该身份组的已分配用户集合
                    self.role_assigned_users[role['role_id']] = set()
                    
                    # 如果是'后台'或'主持人'身份组，默认赋予发言权限
                    if name in ['后台', '主持人']:
                        try:
                            await self.api.update_channel_role_permissions(
                                channel_id=message.channel_id,
                                role_id=role['role_id'],
                                add=Permission(speak_permission=True)
                            )
                            print(f"已默认赋予身份组 {name} 发言权限")
                        except Exception as e:
                            print(f"设置身份组 {name} 发言权限失败: {str(e)}")
                except Exception as e:
                    print(f"创建身份组 {name} 失败: {str(e)}")
        elif message.content.startswith('我是') and any(role_name in message.content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in message.content:
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
        elif message.content.startswith('我不是') and any(role_name in message.content for role_name in self.role_names):
            # 提取身份组名称
            role_name = None
            for name in self.role_names:
                if name in message.content:
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
                        content=f"身份组 {role_name} 不存在",
                        msg_id=message.id,
                        message_reference={"message_id": message.id}
                    )
                else:
                    role_id = self.role_name_to_id[role_name]

                    # 检查用户是否在该身份组中
                    if user_id not in self.role_assigned_users.get(role_id, set()):
                        # 改为被动消息并添加引用
                        await self.api.post_message(
                            channel_id=message.channel_id,
                            content=f"您不在身份组 {role_name} 中",
                            msg_id=message.id,
                            message_reference={"message_id": message.id}
                        )
                    else:
                        try:
                            # 调用API移除用户从身份组
                            await self.api.delete_guild_role_member(
                                guild_id=guild_id,
                                role_id=role_id,
                                user_id=user_id
                            )
                            # 更新已分配用户集合
                            self.role_assigned_users[role_id].remove(user_id)
                            # 改为被动消息并添加引用
                            await self.api.post_message(
                                channel_id=message.channel_id,
                                content=f"成功将您从身份组 {role_name} 中移除",
                                msg_id=message.id,
                                message_reference={"message_id": message.id}
                            )
                        except Exception as e:
                            # 改为被动消息并添加引用
                            await self.api.post_message(
                                channel_id=message.channel_id,
                                content=f"移除身份组 {role_name} 失败: {str(e)}",
                                msg_id=message.id,
                                message_reference={"message_id": message.id}
                            )
        elif '4' in message.content:
            # 获取频道ID
            guild_id = message.guild_id
            
            # 调用按名称删除身份组的方法
            await self.delete_roles_by_names(guild_id)

    async def set_role_speak_permission(self, message, role_name, allow_speak):
        """
        设置指定身份组的发言权限
        :param message: 消息对象
        :param role_name: 身份组名称
        :param allow_speak: 是否允许发言
        """
        guild_id = message.guild_id
        channel_id = message.channel_id
        
        # 检查身份组是否存在
        if role_name not in self.role_name_to_id:
            await self.api.post_message(channel_id=channel_id, content=f"身份组 {role_name} 不存在")
            return
        
        role_id = self.role_name_to_id[role_name]
        
        try:
            if allow_speak:
                # 赋予发言权限
                await self.api.update_channel_role_permissions(
                    channel_id=channel_id,
                    role_id=role_id,
                    add=Permission(speak_permission=True)
                )
                # 改为被动消息并添加引用
                await self.api.post_message(
                    channel_id=message.channel_id,
                    content=f"已允许身份组 {role_name} 在当前频道发言",
                    msg_id=message.id,
                    message_reference={"message_id": message.id}
                )
            else:
                # 移除发言权限
                await self.api.update_channel_role_permissions(
                    channel_id=channel_id,
                    role_id=role_id,
                    remove=Permission(speak_permission=True)
                )
                # 改为被动消息并添加引用
                await self.api.post_message(
                    channel_id=message.channel_id,
                    content=f"已禁止身份组 {role_name} 在当前频道发言",
                    msg_id=message.id,
                    message_reference={"message_id": message.id}
                )
        except Exception as e:
            # 改为被动消息并添加引用
            await self.api.post_message(
                channel_id=channel_id,
                content=f"设置身份组 {role_name} 发言权限失败: {str(e)}",
                msg_id=message.id,
                message_reference={"message_id": message.id}
            )

    async def delete_roles_by_names(self, guild_id):
        """
        根据预定义的身份组名称列表删除匹配的身份组
        """
        try:
            # 获取频道身份组列表
            roles_response = await self.api.get_guild_roles(guild_id=guild_id)
            guild_roles = roles_response.get('roles', [])
            
            # 检查是否获取到身份组
            if not guild_roles:
                print("未获取到任何身份组")
                return
            
            # 要删除的身份组名称列表
            target_role_names = self.role_names
            
            # 存储找到的身份组ID
            roles_to_delete = []
            
            # 匹配身份组名称
            for role in guild_roles:
                role_name = role.get('name')
                role_id = role.get('id')
                
                if role_name in target_role_names:
                    roles_to_delete.append(role_id)
                    print(f"找到匹配的身份组: {role_name} (ID: {role_id})")
            
            # 检查是否有要删除的身份组
            if not roles_to_delete:
                print("没有找到匹配的身份组")
                return
            
            # 循环删除身份组
            for role_id in roles_to_delete:
                try:
                    await self.api.delete_guild_role(
                        guild_id=guild_id,
                        role_id=role_id
                    )
                    print(f"成功删除身份组: {role_id}")
                    
                    # 从映射中删除对应的身份组名称
                    for name, rid in list(self.role_name_to_id.items()):
                        if rid == role_id:
                            del self.role_name_to_id[name]
                            break
                    
                    # 删除已分配用户数据
                    if role_id in self.role_assigned_users:
                        del self.role_assigned_users[role_id]
                    
                    # 从debate_role_ids中移除（如果存在）
                    if role_id in self.debate_role_ids:
                        self.debate_role_ids.remove(role_id)
                except Exception as e:
                    print(f"删除身份组 {role_id} 失败: {str(e)}")
            
            print(f"共删除了 {len(roles_to_delete)} 个身份组")
        except Exception as e:
            print(f"删除身份组过程中发生错误: {str(e)}")

intents = botpy.Intents(guild_messages=True) 
client = MyClient(intents=intents)
client.run('102035721','ir09IRajt3DNXhr2DOZkv6IUgs4GSer4')