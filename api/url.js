const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
  // 获取URL路径，移除开头的斜杠
  const filePath = req.url.slice(1);
  
  // 检查是否有文件路径
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('No file specified. Usage: /path/to/file\nExample: /README.md');
    return;
  }
  
  // 防止路径遍历攻击
  if (filePath.includes('../') || filePath.includes('..\\')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }
  
  // 构建GitHub URL
  const githubUrl = `https://raw.githubusercontent.com/annacom155/ccouo/main/${filePath}`;
  
  console.log(`Fetching: ${githubUrl}`);
  
  // 向GitHub发起请求
  const request = https.get(githubUrl, (githubRes) => {
    // 设置响应头
    const contentType = githubRes.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // 传递状态码
    res.statusCode = githubRes.statusCode;
    
    // 错误处理
    githubRes.on('error', (err) => {
      console.error('Response error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error streaming response');
      }
    });
    
    // 流式传输响应
    githubRes.pipe(res);
    
  }).on('error', (err) => {
    console.error('Request error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error fetching file: ${err.message}`);
    }
  });
  
  // 设置请求超时
  request.setTimeout(10000, () => {
    console.error('Request timeout for:', githubUrl);
    request.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end('Request timeout');
    }
  });
  
  // 处理客户端断开连接
  req.on('close', () => {
    if (!request.destroyed) {
      request.destroy();
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Usage: http://localhost:${PORT}/filename`);
  console.log(`Example: http://localhost:${PORT}/README.md`);
});

// 处理服务器错误
server.on('error', (err) => {
  console.error('Server error:', err);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
