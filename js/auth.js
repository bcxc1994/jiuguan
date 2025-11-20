/**
 * 酒馆日记本 - 认证模块
 * 负责用户登录、权限验证等功能
 */

// GitHub OAuth配置（请替换为您自己的GitHub OAuth应用信息）
const githubConfig = {
  clientId: 'Iv23liX916IcrDFeZQSz', // 请在GitHub开发者设置中创建OAuth应用获取
  redirectUri: 'http://localhost:8889/index.html', // 与GitHub OAuth应用设置的回调URL一致
  scope: 'read:user user:email' // 请求的权限范围
};

// 初始化本地模拟数据
async function initData() {
  try {
    // 检查是否已有数据
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers')) || [];
    
    // 检查是否已有管理员用户
    const adminExists = mockUsers.some(u => u.username === 'admin');
    if (!adminExists) {
      // 添加默认管理员用户
      const adminUser = { 
        id: 'user-1', 
        username: 'admin', 
        password: 'admin123', 
        name: '管理员', 
        role: 'admin', 
        email: 'admin@example.com', 
        createdAt: new Date().toISOString(), 
        lastLogin: null 
      };
      mockUsers.push(adminUser);
    }
    
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    console.log('初始化模拟用户数据完成');
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
}

// 页面加载完成后执行
  document.addEventListener('DOMContentLoaded', async function() {
    // 初始化数据
    await initData();
    
    // 检查GitHub OAuth回调
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      await handleGitHubCallback(code);
      return;
    }
    
    // 预填充用户名和密码
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedUsername) {
      const usernameInput = document.getElementById('username');
      if (usernameInput) {
        usernameInput.value = savedUsername;
      }
    }
    if (savedPassword) {
      const passwordInput = document.getElementById('password');
      const rememberMeCheckbox = document.getElementById('rememberMe');
      if (passwordInput && rememberMeCheckbox) {
        passwordInput.value = savedPassword;
        rememberMeCheckbox.checked = true;
      }
    }
    
    // 绑定GitHub登录按钮事件
    const githubLoginBtn = document.getElementById('githubLogin');
    if (githubLoginBtn) {
      githubLoginBtn.addEventListener('click', redirectToGitHubAuth);
    }

    // 绑定密码查看按钮事件
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
      togglePassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        // 切换图标
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      });
    }
    
    // 处理本地登录表单提交
    const localLoginForm = document.getElementById('localLoginForm');
    if (localLoginForm) {
      localLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        await localLogin(username, password, rememberMe);
      });
    }
  });

  // 本地系统账号登录
  async function localLogin(username, password, rememberMe) {
    try {
      // 本地模拟用户数据
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers')) || [];
      
      // 查找用户
      const user = mockUsers.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error('用户名或密码错误');
      }
      
      // 更新最后登录时间
      await updateLastLogin(user.id);
      
      // 保存当前登录用户到会话或本地存储
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('currentUser', JSON.stringify(user));
      
      // 保存用户名和密码以便下次登录时预填充
      if (rememberMe) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('savedPassword', password);
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }
      
      // 跳转到首页
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('本地登录失败:', error);
      alert('登录失败：' + error.message);
    }
  }



// 重定向到GitHub授权页面
function redirectToGitHubAuth() {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubConfig.clientId}&redirect_uri=${githubConfig.redirectUri}&scope=${githubConfig.scope}`;
  window.location.href = githubAuthUrl;
}

// 处理GitHub OAuth回调
async function handleGitHubCallback(code) {
  try {
    // 注意：GitHub OAuth需要后端服务器来交换access_token，以下是示例代码
    // 请替换为您的后端服务器地址
    const backendUrl = 'http://localhost:3000/api/github/callback';
    
    // 向您的后端服务器发送请求，获取access_token
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('获取GitHub access_token失败');
    }
    
    const { access_token } = await response.json();
    
    // 获取GitHub用户信息
    const githubUser = await getGitHubUserInfo(access_token);
    
    // 在本地创建或更新用户
    const user = await createOrUpdateUserFromGitHub(githubUser);
    
    // 更新最后登录时间
    await updateLastLogin(user.id);
    
    // 保存当前登录用户到会话
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // 跳转到首页
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('GitHub认证失败:', error);
    alert('GitHub认证失败，请重试！请确保已搭建好后端服务器');
    // 清理URL参数
    window.history.replaceState({}, document.title, '/index.html');
  }
}

// 获取GitHub用户信息
async function getGitHubUserInfo(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('获取GitHub用户信息失败');
  }
  
  return response.json();
}

// 创建或更新本地用户
async function createOrUpdateUserFromGitHub(githubUser) {
  try {
    // 本地模拟用户数据（替代Firebase）
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers')) || [];
    
    // 查找是否已有该GitHub用户
    let user = mockUsers.find(u => u.githubId === githubUser.id);
    
    if (user) {
      // 更新现有用户信息
      user.name = githubUser.name || githubUser.login;
      user.email = githubUser.email || `${githubUser.login}@github.com`;
      user.avatarUrl = githubUser.avatar_url;
    } else {
      // 创建新用户
      user = {
        id: `github-${githubUser.id}`,
        username: githubUser.login,
        password: '', // GitHub用户不需要密码
        name: githubUser.name || githubUser.login,
        role: 'user', // 默认给普通用户权限
        email: githubUser.email || `${githubUser.login}@github.com`,
        githubId: githubUser.id,
        avatarUrl: githubUser.avatar_url,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      mockUsers.push(user);
    }
    
    // 保存到本地存储
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    
    return user;
  } catch (error) {
    console.error('创建或更新用户失败:', error);
    return null;
  }
}

// 更新用户最后登录时间
  async function updateLastLogin(userId) {
    try {
      // 本地模拟更新最后登录时间（替代Firebase）
      // 实际项目中需要调用Firebase更新
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers')) || [];
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        mockUsers[userIndex].lastLogin = new Date().toISOString();
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      }
    } catch (error) {
      console.error('更新最后登录时间失败:', error);
    }
  }

// 检查用户是否已登录
function checkLogin() {
  return sessionStorage.getItem('currentUser') !== null || localStorage.getItem('currentUser') !== null;
}

// 获取当前登录用户
function getCurrentUser() {
  let userJson = sessionStorage.getItem('currentUser');
  if (!userJson) {
    userJson = localStorage.getItem('currentUser');
  }
  return userJson ? JSON.parse(userJson) : null;
}

// 检查用户是否具有管理员权限
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

// 用户登出
function logout() {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('savedUsername');
  localStorage.removeItem('savedPassword');
  window.location.href = 'index.html';
}

// 权限控制 - 检查用户是否有权访问页面
function checkPermission(requiredRole = 'user') {
  // 检查用户是否已登录
  if (!checkLogin()) {
    window.location.href = 'index.html';
    return false;
  }
  
  // 检查用户权限
  const user = getCurrentUser();
  if (requiredRole === 'admin' && !isAdmin()) {
    // 无权限，跳转到首页
    window.location.href = 'dashboard.html';
    return false;
  }
  
  return true;
}
