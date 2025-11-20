// 完整的后端服务
// 启动命令: node backend.js
// 导入依赖
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
const fs = require('fs');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// SQLite数据库设置
const DB_FILE = path.join(DATA_DIR, 'auto_weekly.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('创建/打开数据库失败:', err.message);
  } else {
    console.log('成功连接到SQLite数据库:', DB_FILE);
  }
});

// 初始化数据库表结构
db.serialize(() => {
  // 创建用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    email TEXT,
    updatedAt TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('创建用户表失败:', err.message);
  });

  // 创建周报表
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    week TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('创建周报表失败:', err.message);
  });

  // 创建配置表
  db.run(`CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updatedAt TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('创建配置表失败:', err.message);
    return;
  });

  // 检查并添加updatedAt列（如果不存在）
  db.run(`PRAGMA table_info(config)`, (err, columns) => {
    if (err) {
      console.error('获取配置表结构失败:', err.message);
      return;
    }
    const hasUpdatedAt = columns.some(col => col.name === 'updatedAt');
    if (!hasUpdatedAt) {
      db.run(`ALTER TABLE config ADD COLUMN updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err) console.error('添加updatedAt列失败:', err.message);
      });
    }
  });

  // 从config.json文件导入配置到数据库
  const configPath = path.join(DATA_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value, updatedAt) VALUES (?, ?, ?)');
    const updatedAt = new Date().toISOString();
    
    for (const [key, value] of Object.entries(configData)) {
      stmt.run([key, JSON.stringify(value), updatedAt], (err) => {
        if (err) console.error(`导入配置 ${key} 失败:`, err.message);
      });
    }
    
    stmt.finalize(() => {
      console.log('配置已从文件导入数据库');
    });
  }
});

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

// 用户管理API
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: '用户不存在' });
    } else {
      res.json(row);
    }
  });
});

app.post('/api/users', (req, res) => {
  const { id, name, department, email } = req.body;
  const updatedAt = req.body.updatedAt || new Date().toISOString();
  db.run('INSERT OR REPLACE INTO users (id, name, department, email, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, name, department, email, updatedAt],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id, name, department, email, updatedAt });
      }
    });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, department, email } = req.body;
  const updatedAt = new Date().toISOString();
  db.run('UPDATE users SET name = ?, department = ?, email = ?, updatedAt = ? WHERE id = ?',
    [name, department, email, updatedAt, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else if (!row) {
            res.status(404).json({ error: '用户不存在' });
          } else {
            res.json(row);
          }
        });
      }
    });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: '用户删除成功' });
    }
  });
});

// 周报管理API
app.get('/api/reports', (req, res) => {
  db.all('SELECT * FROM reports', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: '周报不存在' });
    } else {
      res.json(row);
    }
  });
});

app.post('/api/reports', (req, res) => {
  const { id, userId, week, content, status, createdAt, updatedAt } = req.body;
  db.run('INSERT OR REPLACE INTO reports (id, userId, week, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, week, content, status || 'draft', createdAt, updatedAt],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json(req.body);
      }
    });
});

app.put('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { userId, week, content, status, createdAt, updatedAt } = req.body;
  db.run('UPDATE reports SET userId = ?, week = ?, content = ?, status = ?, createdAt = ?, updatedAt = ? WHERE id = ?',
    [userId, week, content, status, createdAt, updatedAt, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else if (!row) {
            res.status(404).json({ error: '周报不存在' });
          } else {
            res.json(row);
          }
        });
      }
    });
});

app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM reports WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: '周报删除成功' });
    }
  });
});

// 配置管理API
app.get('/api/config', (req, res) => {
  db.all('SELECT * FROM config', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const config = {};
    let updatedAt = null;

    rows.forEach(row => {
      try {
        config[row.key] = JSON.parse(row.value);
      } catch (parseError) {
        config[row.key] = row.value;
      }
      
      // 获取配置的更新时间
      if (!updatedAt) {
        updatedAt = row.updatedAt;
      } else if (new Date(row.updatedAt) > new Date(updatedAt)) {
        updatedAt = row.updatedAt;
      }
    });

    // 将更新时间添加到配置对象
    if (updatedAt) {
      config.updatedAt = updatedAt;
    }

    res.json(config);
  });
});

app.put('/api/config', (req, res) => {
  // 清空现有配置
  db.run('DELETE FROM config', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 插入新配置
    const config = req.body;
    const updatedAt = new Date().toISOString(); // 使用当前时间作为更新时间

    // 创建插入Promise数组
    const insertPromises = Object.entries(config)
      .filter(([key]) => key !== 'updatedAt') // 跳过top-level的updatedAt字段
      .map(([key, value]) => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO config (key, value, updatedAt) VALUES (?, ?, ?)',
            [key, JSON.stringify(value), updatedAt],
            (err) => {
              if (err) { 
                reject(new Error(`插入配置项 ${key} 失败: ${err.message}`));
              } else {
                resolve();
              }
            }
          );
        });
      });

    // 等待所有插入完成
    Promise.all(insertPromises)
      .then(() => {
        // 将更新时间添加到返回的配置对象中
        const configWithTimestamp = { ...config, updatedAt };
        res.json(configWithTimestamp);
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  });
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