// GitHub OAuth后端示例
// 启动命令: node github-oauth-backend.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// 启用CORS
app.use(cors());
app.use(express.json());

// GitHub OAuth应用配置（请替换为您自己的信息）
const githubConfig = {
  clientId: 'Iv23liX916IcrDFeZQSz',
  clientSecret: 'ac8af7e8f13c47e4b0960033b74fc2344912c824',
  redirectUri: 'http://localhost:8889/index.html'
};

// GitHub回调处理
app.post('/api/github/callback', async (req, res) => {
  const { code } = req.body;
  
  try {
    // 交换access_token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code: code,
        redirect_uri: githubConfig.redirectUri
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    res.json({ access_token });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'GitHub OAuth失败' });
  }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`GitHub OAuth后端服务器已启动，监听端口 ${PORT}`);
  console.log('请确保已将GitHub OAuth应用的回调URL设置为:', githubConfig.redirectUri);
  console.log('访问 http://localhost:3000/api/github/callback 处理OAuth回调');
});