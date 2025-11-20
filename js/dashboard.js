/**
 * 酒馆日记本 - 首页模块
 * 负责首页数据展示、统计等功能
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否已登录
  if (!checkLogin()) {
    return;
  }
  
  // 初始化页面
  initDashboard();
});

// 初始化首页
function initDashboard() {
  // 显示用户信息
  displayUserInfo();
  
  // 设置导航权限
  setupNavigationPermissions();
  
  // 加载统计数据
  loadStatistics();
  
  // 加载最近编辑的周报
  loadRecentReports();
  
  // 设置退出登录事件
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 设置下拉菜单事件
  setupDropdownMenus();
}

// 显示用户信息
function displayUserInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = `欢迎，${user.name}`;
  }
}

// 设置导航权限
function setupNavigationPermissions() {
  // 如果不是管理员，隐藏配置管理和用户管理导航
  if (!isAdmin()) {
    document.getElementById('configNavItem').style.display = 'none';
    document.getElementById('userManagementNavItem').style.display = 'none';
  }
}

// 加载统计数据
async function loadStatistics() {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser();
    
    // 获取所有周报（从localStorage）
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    // 获取所有用户（从localStorage）
    const users = JSON.parse(localStorage.getItem('mockUsers')) || [];
    
    // 计算总周报数
    document.getElementById('totalReports').textContent = reports.length;
    
    // 计算活跃用户数（过去30天内有提交周报的用户）
    const activeUserIds = new Set();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    reports.forEach(report => {
      if (new Date(report.createdAt) >= thirtyDaysAgo) {
        activeUserIds.add(report.userId);
      }
    });
    
    document.getElementById('activeUsers').textContent = activeUserIds.size;
    
    // 计算我的周报数
    const myReports = reports.filter(report => report.userId === currentUser.id);
    document.getElementById('myReports').textContent = myReports.length;
    
    // 计算草稿数
    const draftReports = reports.filter(report => report.status === 'draft');
    document.getElementById('draftReports').textContent = draftReports.length;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 加载最近编辑的周报
function loadRecentReports() {
  // 获取所有周报
  let reports = JSON.parse(localStorage.getItem('reports')) || [];
  
  // 获取当前用户
  const currentUser = getCurrentUser();
  
  // 如果不是管理员，只显示当前用户的周报
  if (!isAdmin()) {
    reports = reports.filter(report => report.userId === currentUser.id);
  }
  
  // 按更新时间排序，最近的在前
  reports.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  // 只显示最近的5条
  const recentReports = reports.slice(0, 5);
  
  // 获取配置数据
  const config = JSON.parse(localStorage.getItem('config')) || {};
  const domains = config.domains || [];
  const brands = config.brands || [];
  const models = config.models || [];
  const baselines = config.baselines || [];
  
  // 获取表格tbody
  const tableBody = document.getElementById('recentReportsTable');
  
  // 清空表格
  tableBody.innerHTML = '';
  
  // 如果没有数据，显示提示
  if (recentReports.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7" class="text-center">暂无数据</td>';
    tableBody.appendChild(row);
    return;
  }
  
  // 填充表格数据
  recentReports.forEach(report => {
    // 获取域控名称
    const domain = domains.find(d => d.id === report.domainId);
    const domainName = domain ? domain.name : '未知';
    
    // 获取品牌名称
    const brand = brands.find(b => b.id === report.brandId);
    const brandName = brand ? brand.name : '未知';
    
    // 获取车型名称
    const model = models.find(m => m.id === report.modelId);
    const modelName = model ? model.name : '未知';
    
    // 获取基线名称
    const baseline = baselines.find(b => b.id === report.baselineId);
    const baselineName = baseline ? baseline.name : '未知';
    
    // 获取状态标签
    let statusBadge = '';
    if (report.status === 'draft') {
      statusBadge = '<span class="badge badge-warning">草稿</span>';
    } else if (report.status === 'submitted') {
      statusBadge = '<span class="badge badge-success">已提交</span>';
    }
    
    // 创建表格行
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(report.startDate)} - ${formatDate(report.endDate)}</td>
      <td>${domainName}</td>
      <td>${brandName}</td>
      <td>${modelName}</td>
      <td>${baselineName}</td>
      <td>${statusBadge}</td>
      <td>
        <a href="report-form.html?id=${report.id}" class="btn btn-sm btn-primary">编辑</a>
      </td>
    `;
    
    tableBody.appendChild(row);
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

// 自动清理一个月前的数据
async function cleanupOldData() {
  try {
    // 清理30天前的旧数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString();
    
    // 获取所有周报（从localStorage）
    let reports = JSON.parse(localStorage.getItem('reports')) || [];
    
    // 筛选出需要删除的旧周报
    const oldReports = reports.filter(report => report.createdAt < thirtyDaysAgoString && report.status === 'submitted');
    
    // 从localStorage中删除旧周报
    reports = reports.filter(report => !(report.createdAt < thirtyDaysAgoString && report.status === 'submitted'));
    localStorage.setItem('reports', JSON.stringify(reports));
    
    console.log(`已清理 ${oldReports.length} 条旧数据`);
    return oldReports.length;
  } catch (error) {
    console.error('清理旧数据失败:', error);
    return 0;
  }
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 数字补零
function padZero(num) {
  return String(num).padStart(2, '0');
}
