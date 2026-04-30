const https = require('https');

export default async (req, res) => {
  const { path = [] } = req.query;
  const filePath = Array.isArray(path) ? path.join('/') : path;
  
  if (!filePath) {
    res.status(400).send('No file specified\nUsage: /api/path/to/file\nExample: /api/README.md');
    return;
  }
  
  // 安全验证
  if (filePath.includes('..') || filePath.includes('//') || filePath.includes('://')) {
    res.status(403).send('Invalid file path');
    return;
  }
  
  // 固定前缀，防止任意 URL 访问
  const githubUrl = `https://raw.githubusercontent.com/annacom155/ccouo/main/${filePath}`;
  
  https.get(githubUrl, (githubRes) => {
    // 传递内容类型
    const contentType = githubRes.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.status(githubRes.statusCode);
    
    githubRes.pipe(res);
    
  }).on('error', (err) => {
    res.status(500).send('Error: ' + err.message);
  });
};
