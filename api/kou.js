import fetch from 'node-fetch';
import crypto from 'crypto';

// 内存存储
const urlCache = new Map();

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { method, query } = req;
  
  // 如果是代理请求（GET /api/kou?id=xxx）
  if (query.id) {
    return handleProxyRequest(req, res);
  }
  
  // 如果是生成链接的POST请求
  if (method === 'POST') {
    return handleGenerateRequest(req, res);
  }
  
  // GET请求返回主页
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>本地链接转发服务</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          line-height: 1.6; 
        }
        .container { background: #f5f5f5; padding: 30px; border-radius: 10px; margin-top: 50px; }
        h1 { color: #333; }
        a { 
          display: inline-block; 
          background: #0070f3; 
          color: white; 
          padding: 12px 24px; 
          border-radius: 5px; 
          text-decoration: none; 
          margin-top: 20px; 
        }
        a:hover { background: #0051bb; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 本地链接转发服务</h1>
        <p>这是一个本地链接转公网链接的代理服务。</p>
        <p>请访问 <a href="/u.html">用户界面</a> 来生成链接。</p>
        <p><strong>API端点：</strong></p>
        <ul>
          <li>POST /api/kou - 生成公网链接（参数：local_url）</li>
          <li>GET /api/kou?id={id} - 通过代理访问本地服务</li>
        </ul>
      </div>
    </body>
    </html>
  `);
}

// 处理代理请求
async function handleProxyRequest(req, res) {
  const { id } = req.query;
  const cacheData = urlCache.get(id);
  
  if (!cacheData) {
    return res.status(404).json({ 
      error: '链接不存在或已过期',
      message: '请重新生成链接'
    });
  }
  
  const { targetUrl, expires } = cacheData;
  
  // 检查是否过期
  if (Date.now() > expires) {
    urlCache.delete(id);
    return res.status(410).json({ 
      error: '链接已过期',
      message: '链接1小时后自动过期，请重新生成'
    });
  }
  
  try {
    // 更新访问计数
    cacheData.accessCount = (cacheData.accessCount || 0) + 1;
    urlCache.set(id, cacheData);
    
    const { method, headers, body } = req;
    const targetUrlWithQuery = req.query.proxyPath 
      ? `${targetUrl}${req.query.proxyPath}` 
      : targetUrl;
    
    // 准备fetch选项
    const fetchOptions = {
      method,
      headers: {},
      redirect: 'follow',
      timeout: 10000
    };
    
    // 复制请求头，排除一些不需要的头
    const excludeHeaders = ['host', 'connection', 'accept-encoding', 'content-length'];
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (!excludeHeaders.includes(lowerKey) && value) {
        fetchOptions.headers[key] = value;
      }
    }
    
    // 处理请求体
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      if (body) {
        fetchOptions.body = JSON.stringify(body);
        fetchOptions.headers['content-type'] = 'application/json';
      }
    }
    
    // 发送请求
    const response = await fetch(targetUrlWithQuery, fetchOptions);
    
    // 复制响应头
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    }
    
    // 设置响应头
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // 转发状态码
    res.status(response.status);
    
    // 根据内容类型返回响应
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
      const text = await response.text();
      res.send(text);
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
    
  } catch (error) {
    console.error('代理错误:', error);
    res.status(502).json({ 
      error: '无法连接到目标服务器',
      message: error.message 
    });
  }
}

// 处理生成链接请求
async function handleGenerateRequest(req, res) {
  let body;
  
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
  } catch (error) {
    body = req.body;
  }
  
  const localUrl = body?.local_url || req.body?.local_url;
  
  if (!localUrl || typeof localUrl !== 'string') {
    return res.status(400).json({ 
      error: '请输入有效的本地链接地址' 
    });
  }
  
  const trimmedUrl = localUrl.trim();
  
  if (!trimmedUrl) {
    return res.status(400).json({ 
      error: '请输入本地链接地址' 
    });
  }
  
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return res.status(400).json({ 
      error: '链接必须以 http:// 或 https:// 开头' 
    });
  }
  
  // 验证URL格式
  try {
    new URL(trimmedUrl);
  } catch (error) {
    return res.status(400).json({ 
      error: '链接格式不正确' 
    });
  }
  
  // 测试链接是否可访问
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const testResponse = await fetch(trimmedUrl, {
      method: 'HEAD',
      signal: controller.signal
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    
    if (!testResponse) {
      return res.status(400).json({ 
        error: '无法连接到该链接',
        message: '请确保服务正在运行且可访问'
      });
    }
  } catch (error) {
    console.log('链接测试失败:', error.message);
    // 继续生成链接，即使测试失败
  }
  
  // 生成唯一ID
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const expires = Date.now() + 3600000; // 1小时
  
  // 保存到缓存
  urlCache.set(uniqueId, {
    targetUrl: trimmedUrl,
    expires,
    createdAt: Date.now(),
    accessCount: 0
  });
  
  // 清理过期缓存的定时器
  setTimeout(() => {
    urlCache.delete(uniqueId);
  }, 3600000);
  
  // 生成公网链接
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const publicUrl = `${baseUrl}/api/kou?id=${uniqueId}`;
  
  res.json({
    success: true,
    data: {
      id: uniqueId,
      publicUrl,
      localUrl: trimmedUrl,
      expires: new Date(expires).toISOString(),
      expiresIn: '1小时',
      qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(publicUrl)}&size=150`
    }
  });
}
