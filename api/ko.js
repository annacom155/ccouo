import fetch from 'node-fetch';
import crypto from 'crypto';

// 内存存储（实际使用可以用Redis）
const urlCache = new Map();

export default async function handler(req, res) {
  const { method, query, body, headers: reqHeaders } = req;
  
  // 如果是代理请求
  if (query.id) {
    return handleProxyRequest(req, res);
  }
  
  // 如果是生成链接的POST请求
  if (method === 'POST') {
    return handleGenerateRequest(req, res);
  }
  
  // 其他情况返回HTML页面
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="0; url=/u.html">
    </head>
    <body>
      正在跳转到主页面...
    </body>
    </html>
  `);
}

// 处理代理请求
async function handleProxyRequest(req, res) {
  const { query, method, headers: reqHeaders } = req;
  const { id } = query;
  
  // 从缓存获取目标URL
  const cacheData = urlCache.get(id);
  if (!cacheData) {
    return res.status(404).json({ error: '链接不存在或已过期' });
  }
  
  const { targetUrl, expires } = cacheData;
  
  // 检查是否过期
  if (Date.now() > expires) {
    urlCache.delete(id);
    return res.status(410).json({ error: '链接已过期（1小时有效）' });
  }
  
  try {
    // 准备请求选项
    const fetchOptions = {
      method,
      headers: {},
      redirect: 'follow',
      timeout: 30000
    };
    
    // 复制请求头（排除一些不需要的）
    for (const [key, value] of Object.entries(reqHeaders)) {
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
        fetchOptions.headers[key] = value;
      }
    }
    
    // 添加用户代理
    if (!fetchOptions.headers['user-agent']) {
      fetchOptions.headers['user-agent'] = 'Mozilla/5.0 (Local-to-Public Proxy)';
    }
    
    // 处理POST数据
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      fetchOptions.body = req.body;
      if (req.body && typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['content-type'] = 'application/json';
      }
    }
    
    // 转发请求
    const response = await fetch(targetUrl, fetchOptions);
    
    // 复制响应头
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    
    // 转发状态码
    res.status(response.status);
    
    // 转发响应体
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      res.send(text);
    } else {
      const buffer = await response.buffer();
      res.send(buffer);
    }
    
  } catch (error) {
    console.error('代理错误:', error);
    res.status(502).json({ error: '无法连接到目标服务器: ' + error.message });
  }
}

// 处理生成链接请求
async function handleGenerateRequest(req, res) {
  const { local_url: localUrl } = req.body;
  
  if (!localUrl || localUrl.trim() === '') {
    return res.status(400).json({ error: '请输入本地链接地址' });
  }
  
  if (!/^https?:\/\//.test(localUrl)) {
    return res.status(400).json({ error: '链接必须以 http:// 或 https:// 开头' });
  }
  
  // 测试链接是否可访问
  try {
    const testResponse = await fetch(localUrl, {
      method: 'HEAD',
      timeout: 5000
    }).catch(() => null);
    
    if (!testResponse) {
      return res.status(400).json({ error: '无法连接到该链接，请确保服务正在运行' });
    }
  } catch (error) {
    return res.status(400).json({ error: '无法连接到该链接: ' + error.message });
  }
  
  // 生成唯一ID
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const expires = Date.now() + 3600000; // 1小时后过期
  
  // 保存到缓存
  urlCache.set(uniqueId, {
    targetUrl: localUrl,
    expires,
    createdAt: Date.now(),
    accessCount: 0
  });
  
  // 设置清理定时器（1小时后自动清理）
  setTimeout(() => {
    if (urlCache.has(uniqueId)) {
      urlCache.delete(uniqueId);
    }
  }, 3600000);
  
  // 生成公网链接
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'your-domain.vercel.app';
  const publicUrl = `${protocol}://${host}/api/kou?id=${uniqueId}`;
  
  res.json({
    success: true,
    data: {
      id: uniqueId,
      publicUrl,
      localUrl,
      expires: new Date(expires).toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`
    }
  });
}
