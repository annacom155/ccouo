<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub 文件管理器</title>
  <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/annacom155/ccouo/json/css/github_admin_b.css"
 
</head>
<body>
    <div class="container">
        <h1>GitHub 文件管理器</h1>
        
                
        <div class="notice-area" style="
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 12px 15px;
            margin: 0 0 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #5d4037;
        ">
            <div style="font-weight: bold; margin-bottom: 8px; color: #e65100;">
                使用须知
            </div>
            <ul style="margin: 0; padding-left: 20px;">
                <li>1. 文件夹名称请尽量使用英文，兼容性最佳</li>
                <li>2. 当前版本不支持直接删除文件夹（如需删除，请到GitHub仓库操作）</li>
                <li>3. 国内直链代理:https://ccouo.cn/wwwcn/kpi/yuzusoft.php?url=https://cdn.jsdelivr.net/gh/annacom155/ccouo/文件夹或文件名</li>
                            </ul>
        </div>
        
        <div class="breadcrumb">
            <a href="?">根目录</a>
             / <a href="?path=oppress">oppress</a>        </div>
        
        <div class="current-path">
            当前路径: oppress        </div>
        
        <div class="actions">
            <a href="?path=oppress&action=upload" class="btn">上传文件</a>
            <a href="?path=oppress&action=mkdir" class="btn">新建文件夹</a>
            <a href="?path=oppress" class="btn">刷新列表</a>
        </div>
        
                
                
        <h3>文件列表</h3>
                    <ul class="file-list">
                                    <li class="file-item">
                        <div class="file-icon">
                            文件_                        </div>
                        <div class="file-name ">
                                                            .gitkeep                                <small>(0 bytes)</small>
                                                    </div>
                        <div class="file-actions">
                                                            <a href="?path=oppress&action=download&file=.gitkeep">下载</a>
                                <!-- 添加查看按钮 -->
                                <a href="./detaileddocument.html?file=.gitkeep&path=oppress">查看</a>
                                                        <a href="?path=oppress&action=delete&file=.gitkeep" 
                               onclick="return confirm('确定要删除 .gitkeep 吗？')">删除</a>
                        </div>
                    </li>
                            </ul>
            </div>
    
    <script>
        // 简单的确认删除
        function confirmDelete(fileName) {
            return confirm('确定要删除 ' + fileName + ' 吗？');
        }
    </script>
</body>
</html>

