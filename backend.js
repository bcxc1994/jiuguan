// 完整的后端服务
// 启动命令: node backend.js
// 导入依赖
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 初始化数据文件
const initDataFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initDataFile(REPORTS_FILE, []);
initDataFile(USERS_FILE, []);
initDataFile(CONFIG_FILE, {});

// 启用CORS
app.use(cors());
app.use(express.json());
// 静态文件服务 - 用于前端HTML页面
app.use(express.static(path.join(__dirname, '.')));

// 日志中间件 - 增强版
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - 请求开始: ${req.method} ${req.url}`);
  console.log(`  客户端IP: ${req.ip}`);
  console.log(`  请求头: ${JSON.stringify(req.headers)}`);
  
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} - 请求完成: ${req.method} ${req.url} - ${res.statusCode}`);
    console.log(`  响应头: ${JSON.stringify(res.getHeaders())}`);
  });
  
  next();
});

// 辅助函数：读取数据
const readData = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

// 辅助函数：写入数据
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 用户管理API
app.get('/api/users', (req, res) => res.json(readData(USERS_FILE)));
app.get('/api/users/:id', (req, res) => {
  const user = readData(USERS_FILE).find(u => u.id === req.params.id);
  user ? res.json(user) : res.status(404).json({ error: '用户不存在' });
});
app.post('/api/users', (req, res) => {
  const users = readData(USERS_FILE);
  users.push(req.body);
  writeData(USERS_FILE, users);
  res.status(201).json(req.body);
});
app.put('/api/users/:id', (req, res) => {
  const users = readData(USERS_FILE);
  const index = users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    writeData(USERS_FILE, users);
    res.json(users[index]);
  } else {
    res.status(404).json({ error: '用户不存在' });
  }
});
app.delete('/api/users/:id', (req, res) => {
  const users = readData(USERS_FILE).filter(u => u.id !== req.params.id);
  writeData(USERS_FILE, users);
  res.json({ message: '用户删除成功' });
});

// 周报管理API
app.get('/api/reports', (req, res) => res.json(readData(REPORTS_FILE)));
app.get('/api/reports/:id', (req, res) => {
  const report = readData(REPORTS_FILE).find(r => r.id === req.params.id);
  report ? res.json(report) : res.status(404).json({ error: '周报不存在' });
});
app.post('/api/reports', (req, res) => {
  const reports = readData(REPORTS_FILE);
  reports.push(req.body);
  writeData(REPORTS_FILE, reports);
  res.status(201).json(req.body);
});
app.put('/api/reports/:id', (req, res) => {
  const reports = readData(REPORTS_FILE);
  const index = reports.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    reports[index] = { ...reports[index], ...req.body };
    writeData(REPORTS_FILE, reports);
    res.json(reports[index]);
  } else {
    res.status(404).json({ error: '周报不存在' });
  }
});
app.delete('/api/reports/:id', (req, res) => {
  const reports = readData(REPORTS_FILE).filter(r => r.id !== req.params.id);
  writeData(REPORTS_FILE, reports);
  res.json({ message: '周报删除成功' });
});

// 配置管理API
app.get('/api/config', (req, res) => res.json({ test: 'Hello World' }));
app.put('/api/config', (req, res) => {
  const config = { ...readData(CONFIG_FILE), ...req.body };
  writeData(CONFIG_FILE, config);
  res.json(config);
});

// 启动服务器
app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务器已启动，监听端口 ${PORT}`);
  console.log('API端点：');
  console.log('  用户管理: GET/POST/PUT/DELETE /api/users');
  console.log('  周报管理: GET/POST/PUT/DELETE /api/reports');
  console.log('  配置管理: GET/PUT /api/config');
  
  // 自动测试API以调试问题
  console.log('=== 自动测试API ===');
  console.log('开始API测试的时间:', new Date().toISOString());
  
  const testAPI = () => {
    console.log('=== 开始API测试 ===');
    
    const req = http.get(`http://localhost:${PORT}/api/config`, (res) => {
      console.log(`/api/config - 状态码: ${res.statusCode}`);
      res.on('data', (chunk) => console.log(`/api/config - 响应: ${chunk.toString()}`));
      res.on('end', () => console.log('=== API测试完成 ==='));
    });
    
    req.setTimeout(5000); // 设置5秒超时
    
    req.on('error', (error) => {
      console.error(`/api/config - 请求错误: ${error.message}`);
      console.log('=== API测试完成 ===');
    });
    
    req.on('timeout', () => {
      console.error(`/api/config - 请求超时`);
      req.destroy();
      console.log('=== API测试完成 ===');
    });
  };
  
  testAPI(); // 调用API测试函数
});