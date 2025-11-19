/**
 * 酒馆日记本 - 认证模块
 * 负责用户登录、权限验证等功能
 */

// 初始化数据
function initData() {
  // 检查本地存储中是否已有数据
  if (!localStorage.getItem('users')) {
    // 初始化默认用户数据
    const defaultUsers = [
      {
        id: 'admin',
        username: 'admin',
        password: 'admin', // 实际应用中应加密存储
        name: '系统管理员',
        role: 'admin', // admin 或 user
        email: 'admin@example.com',
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        id: 'user1',
        username: 'user',
        password: 'user', // 实际应用中应加密存储
        name: '普通用户',
        role: 'user',
        email: 'user@example.com',
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
  
  // 检查配置数据是否存在
  if (!localStorage.getItem('config')) {
    // 初始化默认配置数据
    const defaultConfig = {
      domains: [
        {
          id: 'domain1',
          name: '动力域',
          description: '负责车辆动力系统相关项目',
          brands: ['brand1', 'brand2']
        },
        {
          id: 'domain2',
          name: '底盘域',
          description: '负责车辆底盘系统相关项目',
          brands: ['brand1', 'brand3']
        },
        {
          id: 'domain3',
          name: '车身域',
          description: '负责车辆车身系统相关项目',
          brands: ['brand2', 'brand3']
        }
      ],
      brands: [
        {
          id: 'brand1',
          name: '品牌A',
          domainId: 'domain1',
          models: ['model1', 'model2']
        },
        {
          id: 'brand2',
          name: '品牌B',
          domainId: 'domain1',
          models: ['model3']
        },
        {
          id: 'brand3',
          name: '品牌C',
          domainId: 'domain2',
          models: ['model4']
        }
      ],
      models: [
        {
          id: 'model1',
          name: '车型A1',
          brandId: 'brand1',
          baselines: ['baseline1', 'baseline2']
        },
        {
          id: 'model2',
          name: '车型A2',
          brandId: 'brand1',
          baselines: ['baseline1']
        },
        {
          id: 'model3',
          name: '车型B1',
          brandId: 'brand2',
          baselines: ['baseline3']
        },
        {
          id: 'model4',
          name: '车型C1',
          brandId: 'brand3',
          baselines: ['baseline4']
        }
      ],
      baselines: [
        {
          id: 'baseline1',
          name: '基线V1.0',
          modelId: 'model1',
          description: '初始版本基线'
        },
        {
          id: 'baseline2',
          name: '基线V2.0',
          modelId: 'model1',
          description: '优化版本基线'
        },
        {
          id: 'baseline3',
          name: '基线V1.0',
          modelId: 'model3',
          description: '初始版本基线'
        },
        {
          id: 'baseline4',
          name: '基线V1.0',
          modelId: 'model4',
          description: '初始版本基线'
        }
      ],
      businessModules: [
        {
          id: 'module1',
          name: '需求分析',
          domainIds: ['domain1', 'domain2', 'domain3'],
          description: '项目需求收集与分析'
        },
        {
          id: 'module2',
          name: '系统设计',
          domainIds: ['domain1', 'domain2', 'domain3'],
          description: '系统架构与详细设计'
        },
        {
          id: 'module3',
          name: '开发实现',
          domainIds: ['domain1', 'domain2', 'domain3'],
          description: '代码开发与单元测试'
        },
        {
          id: 'module4',
          name: '集成测试',
          domainIds: ['domain1', 'domain2', 'domain3'],
          description: '系统集成与测试验证'
        },
        {
          id: 'module5',
          name: '问题修复',
          domainIds: ['domain1', 'domain2', 'domain3'],
          description: '缺陷跟踪与修复'
        }
      ]
    };
    
    localStorage.setItem('config', JSON.stringify(defaultConfig));
  }
  
  // 检查周报数据是否存在
  if (!localStorage.getItem('reports')) {
    localStorage.setItem('reports', JSON.stringify([]));
  }
}

// 页面加载完成后执行
	document.addEventListener('DOMContentLoaded', function() {
	  // 初始化数据
	  initData();
	  
	  // 加载记住的密码
	  loadRememberedPassword();
	  
	  // 获取登录表单
  const loginForm = document.getElementById('loginForm');
  
  // 只有在登录表单存在时才添加提交事件
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // 获取用户名和密码
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberPassword = document.getElementById('rememberPassword').checked;
      
      // 验证用户
      const user = authenticateUser(username, password);
      
      if (user) {
        // 更新最后登录时间
        updateLastLogin(user.id);
        
        // 保存当前登录用户到会话
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // 保存记住的密码
        if (rememberPassword) {
          localStorage.setItem('rememberedUser', JSON.stringify({ username, password }));
        } else {
          localStorage.removeItem('rememberedUser');
        }
        
        // 跳转到首页
        window.location.href = 'dashboard.html';
      } else {
        // 显示错误消息
        alert('用户名或密码错误，请重试！');
      }
    });
  }
	});

	// 加载记住的密码
function loadRememberedPassword() {
  const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
  if (rememberedUser) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberPassword');
    
    if (usernameInput) usernameInput.value = rememberedUser.username;
    if (passwordInput) passwordInput.value = rememberedUser.password;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

// 用户认证函数
function authenticateUser(username, password) {
  // 从本地存储获取用户数据
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  // 查找匹配的用户
  return users.find(user => user.username === username && user.password === password);
}

// 更新用户最后登录时间
function updateLastLogin(userId) {
  // 从本地存储获取用户数据
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  // 查找并更新用户
  const updatedUsers = users.map(user => {
    if (user.id === userId) {
      return {
        ...user,
        lastLogin: new Date().toISOString()
      };
    }
    return user;
  });
  
  // 保存更新后的用户数据
  localStorage.setItem('users', JSON.stringify(updatedUsers));
}

// 检查用户是否已登录
function checkLogin() {
  return sessionStorage.getItem('currentUser') !== null;
}

// 获取当前登录用户
function getCurrentUser() {
  const userJson = sessionStorage.getItem('currentUser');
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
