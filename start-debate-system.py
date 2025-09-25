#!/usr/bin/env python3
"""
辩论计时器系统启动脚本
同时启动QQ机器人和前端应用
"""

import subprocess
import sys
import os
import time
import threading

def start_qq_bot():
    """启动QQ机器人"""
    print("正在启动QQ机器人...")
    try:
        subprocess.run([sys.executable, "qq.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"QQ机器人启动失败: {e}")
    except KeyboardInterrupt:
        print("QQ机器人已停止")

def start_frontend():
    """启动前端应用"""
    print("正在启动前端应用...")
    try:
        os.chdir("debate-timer")
        # Windows系统使用npm.cmd
        if os.name == 'nt':
            subprocess.run(["npm.cmd", "run", "dev"], check=True)
        else:
            subprocess.run(["npm", "run", "dev"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"前端应用启动失败: {e}")
    except KeyboardInterrupt:
        print("前端应用已停止")

def main():
    print("=== 辩论计时器系统启动 ===")
    print("正在启动QQ机器人和前端应用...")
    
    # 创建线程启动QQ机器人
    qq_thread = threading.Thread(target=start_qq_bot, daemon=True)
    qq_thread.start()
    
    # 等待QQ机器人启动
    time.sleep(3)
    
    # 启动前端应用（主线程）
    try:
        start_frontend()
    except KeyboardInterrupt:
        print("\n正在关闭系统...")
        sys.exit(0)

if __name__ == "__main__":
    main()