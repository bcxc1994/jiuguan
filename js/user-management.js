/**
 * 酒馆日记本 - 用户管理模块
 * 负责用户管理页面的功能实现，包括用户列表展示、新增、编辑、删除用户等
 */

// 全局变量
let users = [];
let currentUser = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
  // 检查用户是否已登录且具有管理员权限
  if (!checkPermission('admin')) {
    return;
  }
  
  // 初始化页面
  await initUserManagementPage();
});

// 初始化用户管理页面
async function initUserManagementPage() {
  // 显示当前登录用户信息
  displayCurrentUserInfo();
  
  // 加载用户数据
  await loadUserData();
  
  // 渲染用户表格
  renderUserTable();
  
  // 设置事件监听
  setupEventListeners();
}

// 显示当前登录用户信息
function displayCurrentUserInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = `欢迎，${user.name}（管理员）`;
  }
}

// 加载用户数据
async function loadUserData() {
  try {
    // 使用localStorage存储用户数据（替代Firebase）
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers')) || [];
    users = mockUsers;
  } catch (error) {
    console.error('加载用户数据失败:', error);
    users = [];
  }
}

// 渲染用户表格
function renderUserTable() {
  const tableBody = document.getElementById('userTableBody');
  
  // 清空表格
  tableBody.innerHTML = '';
  
  // 如果没有用户数据，显示提示
  if (users.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7" class="text-center">暂无用户数据</td>';
    tableBody.appendChild(row);
    return;
  }
  
  // 渲染用户数据
  users.forEach(user => {
    const row = document.createElement('tr');
    
    // 格式化日期
    const createdAt = formatDate(user.createdAt);
    const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : '-';
    
    // 设置角色标签
    const roleBadge = user.role === 'admin' 
      ? '<span class="badge badge-danger">管理员</span>' 
      : '<span class="badge badge-primary">普通用户</span>';
    
    // 设置操作按钮
    const actions = `
      <button class="btn btn-sm btn-primary edit-btn" data-id="${user.id}">编辑</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}" ${isCurrentUser(user.id) ? 'disabled' : ''}>删除</button>
    `;
    
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.name}</td>
      <td>${user.email || '-'}</td>
      <td>${roleBadge}</td>
      <td>${createdAt}</td>
      <td>${lastLogin}</td>
      <td>${actions}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // 设置编辑和删除按钮事件
  setupTableButtonEvents();
}

// 设置表格按钮事件
function setupTableButtonEvents() {
  // 编辑按钮事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.dataset.id;
      editUser(userId);
    });
  });
  
  // 删除按钮事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.dataset.id;
      deleteUser(userId);
    });
  });
}

// 设置事件监听
function setupEventListeners() {
  // 新增用户按钮事件
  document.getElementById('addNewBtn').addEventListener('click', function() {
    addNewUser();
  });
  
  // 关闭模态框按钮事件
  document.getElementById('closeModalBtn').addEventListener('click', function() {
    closeModal();
  });
  
  // 取消按钮事件
  document.getElementById('cancelBtn').addEventListener('click', function() {
    closeModal();
  });
  
  // 保存按钮事件
  document.getElementById('saveBtn').addEventListener('click', function() {
    saveUser();
  });
  
  // 密码查看按钮事件
  document.getElementById('toggleModalPassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // 切换图标
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
  
  // 关闭删除模态框按钮事件
  document.getElementById('closeDeleteModalBtn').addEventListener('click', function() {
    closeDeleteModal();
  });
  
  // 取消删除按钮事件
  document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    closeDeleteModal();
  });
  
  // 确认删除按钮事件
  document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    confirmDeleteUser();
  });
  
  // 退出登录按钮事件
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 设置下拉菜单事件
  setupDropdownMenus();
  
  // 点击模态框外部关闭模态框
  window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('userModal')) {
      closeModal();
    }
    if (e.target === document.getElementById('deleteModal')) {
      closeDeleteModal();
    }
  });
}

// 设置下拉菜单事件
function setupDropdownMenus() {
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 切换下拉菜单显示/隐藏
      const dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle('show');
      
      // 关闭其他下拉菜单
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.classList.remove('show');
        }
      });
    });
  });
  
  // 点击页面其他地方关闭下拉菜单
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
}

// 新增用户
function addNewUser() {
  // 重置当前用户
  currentUser = null;
  
  // 设置模态框标题
  document.getElementById('modalTitle').textContent = '新增用户';
  
  // 清空表单
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  
  // 设置密码为必填
  document.getElementById('passwordRequired').style.display = 'inline';
  document.getElementById('password').required = true;
  
  // 默认选择普通用户
  document.querySelector('input[name="role"][value="user"]').checked = true;
  
  // 显示模态框
  document.getElementById('userModal').classList.add('show');
}

// 编辑用户
function editUser(userId) {
  // 获取用户
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    showAlert('用户不存在或已被删除', 'danger');
    return;
  }
  
  // 设置当前用户
  currentUser = user;
  
  // 设置模态框标题
  document.getElementById('modalTitle').textContent = '编辑用户';
  
  // 填充表单数据
  document.getElementById('userId').value = user.id;
  document.getElementById('username').value = user.username;
  document.getElementById('name').value = user.name;
  document.getElementById('email').value = user.email || '';
  
  // 设置角色
  document.querySelector(`input[name="role"][value="${user.role}"]`).checked = true;
  
  // 设置密码为可选
  document.getElementById('passwordRequired').style.display = 'none';
  document.getElementById('password').required = false;
  document.getElementById('password').value = '';
  document.getElementById('passwordHint').textContent = '不修改密码请留空';
  
  // 显示模态框
  document.getElementById('userModal').classList.add('show');
}

// 删除用户
function deleteUser(userId) {
  // 检查是否是当前登录用户
  if (isCurrentUser(userId)) {
    showAlert('不能删除当前登录的用户', 'danger');
    return;
  }
  
  // 获取用户
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    showAlert('用户不存在或已被删除', 'danger');
    return;
  }
  
  // 设置当前用户
  currentUser = user;
  
  // 设置删除提示
  document.getElementById('deleteUserName').textContent = user.username;
  
  // 显示删除确认模态框
  document.getElementById('deleteModal').classList.add('show');
}

// 确认删除用户
function confirmDeleteUser() {
  if (!currentUser) return;
  
  try {
    // 从用户列表中删除用户
    users = users.filter(user => user.id !== currentUser.id);
    
    // 保存用户数据
    saveUserData();
    
    // 重新渲染用户表格
    renderUserTable();
    
    // 显示成功提示
    showAlert('用户删除成功', 'success');
  } catch (error) {
    console.error('删除用户失败:', error);
    showAlert('删除用户失败', 'danger');
  } finally {
    // 关闭删除模态框
    closeDeleteModal();
    
    // 重置当前用户
    currentUser = null;
  }
}

// 保存用户
function saveUser() {
  // 获取表单数据
  const userId = document.getElementById('userId').value;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const role = document.querySelector('input[name="role"]:checked').value;
  
  // 验证必填字段
  if (!username) {
    showAlert('用户名不能为空', 'danger');
    return;
  }
  
  if (!name) {
    showAlert('姓名不能为空', 'danger');
    return;
  }
  
  // 如果是新增用户或修改密码，验证密码
  if ((!userId && !password) || (userId && password && password.length < 6)) {
    showAlert('密码长度至少6位', 'danger');
    return;
  }
  
  // 检查用户名是否已存在（新增用户或修改了用户名）
  const usernameExists = users.some(user => 
    user.username === username && user.id !== userId
  );
  
  if (usernameExists) {
    showAlert('用户名已存在', 'danger');
    return;
  }
  
  try {
    if (userId) {
      // 编辑现有用户
      const index = users.findIndex(user => user.id === userId);
      if (index >= 0) {
        const updatedUser = {
          ...users[index],
          username,
          name,
          email,
          role,
          updatedAt: new Date().toISOString()
        };
        
        // 如果填写了密码，则更新密码
        if (password) {
          updatedUser.password = password; // 实际应用中应加密存储
        }
        
        users[index] = updatedUser;
      }
    } else {
      // 添加新用户
      const newUser = {
        id: generateId(),
        username,
        password, // 实际应用中应加密存储
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      users.push(newUser);
    }
    
    // 保存用户数据
    saveUserData();
    
    // 重新渲染用户表格
    renderUserTable();
    
    // 显示成功提示
    showAlert(userId ? '用户更新成功' : '用户创建成功', 'success');
    
    // 关闭模态框
    closeModal();
  } catch (error) {
    console.error('保存用户失败:', error);
    showAlert('保存用户失败', 'danger');
  }
}

async function saveUserData() {
  try {
    // 使用localStorage存储用户数据（替代Firebase）
    localStorage.setItem('mockUsers', JSON.stringify(users));
    console.log('用户数据保存到localStorage完成');
  } catch (error) {
    console.error('保存用户数据失败:', error);
  }
}

// 关闭模态框
function closeModal() {
  document.getElementById('userModal').classList.remove('show');
  currentUser = null;
}

// 关闭删除模态框
function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  currentUser = null;
}

// 显示提示消息
function showAlert(message, type) {
  const alertElement = document.getElementById('alertMessage');
  
  // 设置提示类型
  alertElement.className = 'alert';
  alertElement.classList.add(`alert-${type}`);
  
  // 设置提示内容
  alertElement.textContent = message;
  
  // 显示提示
  alertElement.style.display = 'block';
  
  // 3秒后隐藏提示
  setTimeout(() => {
    alertElement.style.display = 'none';
  }, 3000);
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 数字补零
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

// 检查是否是当前登录用户
function isCurrentUser(userId) {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.id === userId;
}
