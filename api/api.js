const express = require('express');
const ip = require('ip');
const app = express();
const PORT = 3000;

// 获取客户端真实IP
function getClientIP(req) {
    let clientIP = '';
    
    // 检查HTTP_CLIENT_IP
    if (req.headers['http_client_ip']) {
        clientIP = req.headers['http_client_ip'];
    }
    // 检查HTTP_X_FORWARDED_FOR
    else if (req.headers['x-forwarded-for']) {
        const ipList = req.headers['x-forwarded-for'].split(',');
        clientIP = ipList[0].trim();
    }
    // 使用REMOTE_ADDR
    else {
        clientIP = req.ip || req.connection.remoteAddress || '0.0.0.0';
    }
    
    // 清理IPv6前缀
    clientIP = clientIP.replace('::ffff:', '');
    
    // 验证IP格式
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    if (ipv4Regex.test(clientIP) || ipv6Regex.test(clientIP)) {
        return clientIP;
    } else {
        return '无效IP';
    }
}

// 获取IP类型
function getIPType(ip) {
    if (ip === '无效IP') return '未知';
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    if (ipv4Regex.test(ip)) return 'IPv4';
    if (ipv6Regex.test(ip)) return 'IPv6';
    return '未知';
}

// 生成HTML页面
function generateHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>您的IP地址</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
        body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}
        .container{background:rgba(255,255,255,0.95);border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.2);padding:40px;width:100%;max-width:600px;text-align:center}
        h1{color:#333;margin-bottom:10px;font-size:2.2rem}
        .subtitle{color:#666;margin-bottom:30px}
        .ip-box{background:#f8f9ff;border-radius:15px;padding:30px;margin:25px 0;border:3px solid #667eea}
        .ip-label{color:#555;font-size:1.1rem;margin-bottom:10px}
        .ip-address{color:#2d3748;font-size:2.5rem;font-weight:bold;font-family:'Courier New',monospace;word-break:break-all}
        .info{background:#f0f7ff;border-radius:10px;padding:20px;margin-top:25px;text-align:left;border-left:4px solid #667eea}
        .info h3{color:#333;margin-bottom:10px}
        .info p{color:#555;line-height:1.5;margin:5px 0}
        .btn{background:linear-gradient(90deg,#667eea,#764ba2);color:white;border:none;padding:12px 30px;font-size:1rem;border-radius:25px;cursor:pointer;margin-top:20px;transition:0.3s}
        .btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(102,126,234,0.4)}
        .footer{margin-top:25px;color:#777;font-size:0.9rem}
        .ip-type{display:inline-block;background:#e6f7ff;color:#0066cc;padding:3px 10px;border-radius:12px;font-size:0.9rem;margin-top:5px}
        .copy-notice{position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:10px 20px;border-radius:5px;display:none;animation:fadeInOut 1.5s}
        @keyframes fadeInOut{0%{opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}
    </style>
</head>
<body>
    <div id="copyNotice" class="copy-notice">IP地址已复制到剪贴板！</div>
    
    <div class="container">
        <h1>🌐 您的IP地址</h1>
        <p class="subtitle">我们检测到您正在访问本页面</p>
        
        <div class="ip-box">
            <div class="ip-label">检测到的IP地址：</div>
            <div class="ip-address" id="ipAddress" title="点击复制IP地址">${data.userIP}</div>
            <div class="ip-type">${data.ipType} 地址</div>
        </div>
        
        <div class="info">
            <h3>📊 访问信息</h3>
            <p><strong>用户代理：</strong>${data.userAgent}</p>
            <p><strong>访问时间：</strong>${data.requestTime}</p>
            <p><strong>服务器IP：</strong>${data.serverIP}</p>
            <p><strong>请求方法：</strong>${data.requestMethod}</p>
            <p><strong>检测来源：</strong>${data.detectionSource}</p>
            <p><strong>请求协议：</strong>${data.protocol}</p>
            <p><strong>服务器主机：</strong>${data.host}</p>
        </div>
        
        <button class="btn" onclick="window.location.reload()">🔄 刷新页面</button>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} IP检测服务 | Node.js 实现</p>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const ipElement = document.getElementById('ipAddress');
            const copyNotice = document.getElementById('copyNotice');
            
            if(ipElement && ipElement.textContent !== '无效IP') {
                ipElement.style.cursor = 'pointer';
                ipElement.addEventListener('click', function() {
                    const text = this.textContent;
                    navigator.clipboard.writeText(text).then(() => {
                        copyNotice.style.display = 'block';
                        setTimeout(() => {
                            copyNotice.style.display = 'none';
                        }, 1500);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                });
            }
        });
    </script>
</body>
</html>`;
}

// 路由处理
app.get('/', (req, res) => {
    const userIP = getClientIP(req);
    const ipType = getIPType(userIP);
    
    // 获取用户代理，截断过长的字符串
    let userAgent = req.headers['user-agent'] || '未知';
    if (userAgent.length > 80) {
        userAgent = userAgent.substring(0, 80) + '...';
    }
    
    // 获取检测来源
    let detectionSource = 'REMOTE_ADDR';
    if (req.headers['http_client_ip']) {
        detectionSource = 'HTTP_CLIENT_IP';
    } else if (req.headers['x-forwarded-for']) {
        detectionSource = 'HTTP_X_FORWARDED_FOR';
    }
    
    // 准备数据
    const data = {
        userIP: userIP,
        ipType: ipType,
        userAgent: userAgent,
        requestTime: new Date().toLocaleString('zh-CN', { 
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        serverIP: ip.address(),
        requestMethod: req.method,
        detectionSource: detectionSource,
        protocol: req.protocol || 'http',
        host: req.headers.host || '未知'
    };
    
    res.send(generateHTML(data));
});

// 提供API接口
app.get('/api/ip', (req, res) => {
    const data = {
        ip: getClientIP(req),
        ipType: getIPType(getClientIP(req)),
        userAgent: req.headers['user-agent'] || '未知',
        timestamp: new Date().toISOString(),
        location: {
            country: '未知',
            region: '未知',
            city: '未知'
        }
    };
    
    res.json({
        success: true,
        data: data
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`✅ IP检测服务运行在: http://localhost:${PORT}`);
    console.log(`🌍 本机IP: ${ip.address()}`);
});
