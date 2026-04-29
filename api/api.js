// 文件: /api/edge.js
export const config = {
  runtime: 'edge',
};

export default function handler(request) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '0.0.0.0';
  
  const userAgent = request.headers.get('user-agent') || '未知';
  const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const referer = request.headers.get('referer') || '无';
  const acceptLanguage = request.headers.get('accept-language') || '未知';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>您的IP地址</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            padding: 40px;
            width: 100%;
            max-width: 700px;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.2rem;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .ip-box {
            background: #f8f9ff;
            border-radius: 15px;
            padding: 30px;
            margin: 25px 0;
            border: 3px solid #667eea;
        }
        .ip-label {
            color: #555;
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        .ip-address {
            color: #2d3748;
            font-size: 2.2rem;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            cursor: pointer;
            transition: all 0.3s;
        }
        .ip-address:hover {
            color: #667eea;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
            text-align: left;
        }
        .info-item {
            background: #f0f7ff;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .info-item strong {
            display: block;
            color: #333;
            margin-bottom: 5px;
        }
        .info-item span {
            color: #666;
            word-break: break-all;
        }
        .btn {
            background: linear-gradient(90deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 1rem;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
            transition: 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .copy-notice {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            display: none;
            animation: fadeInOut 1.5s;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .ip-address {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div id="copyNotice" class="copy-notice">IP地址已复制到剪贴板！</div>
    
    <div class="container">
        <h1>🌐 您的IP地址</h1>
        <p class="subtitle">实时检测您的网络连接信息</p>
        
        <div class="ip-box">
            <div class="ip-label">检测到的IP地址：</div>
            <div class="ip-address" id="ipAddress" title="点击复制IP地址">${ip}</div>
        </div>
        
        <div class="info-grid">
            <div class="info-item">
                <strong>访问时间</strong>
                <span>${time}</span>
            </div>
            <div class="info-item">
                <strong>用户代理</strong>
                <span>${userAgent.substring(0, 60)}${userAgent.length > 60 ? '...' : ''}</span>
            </div>
            <div class="info-item">
                <strong>请求来源</strong>
                <span>${referer === '无' ? '直接访问' : referer}</span>
            </div>
            <div class="info-item">
                <strong>支持语言</strong>
                <span>${acceptLanguage}</span>
            </div>
        </div>
        
        <button class="btn" onclick="location.reload()">🔄 刷新页面</button>
        
        <div style="margin-top: 20px; color: #777; font-size: 0.9rem;">
            <p>© ${new Date().getFullYear()} IP检测服务 | 基于Vercel Edge Functions</p>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const ipElement = document.getElementById('ipAddress');
            const copyNotice = document.getElementById('copyNotice');
            
            if(ipElement) {
                ipElement.addEventListener('click', function() {
                    const text = this.textContent;
                    navigator.clipboard.writeText(text).then(() => {
                        copyNotice.style.display = 'block';
                        setTimeout(() => {
                            copyNotice.style.display = 'none';
                        }, 1500);
                    });
                });
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
