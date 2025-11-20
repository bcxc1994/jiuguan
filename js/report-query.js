/**
 * 酒馆日记本 - 周报查询与导出模块
 * 负责周报查询与导出页面的功能实现，包括多条件查询、分页、导出等
 */

// 全局变量
let config = {
  domains: [],
  brands: [],
  models: [],
  baselines: [],
  businessModules: []
};

let users = [];
let reports = [];
let filteredReports = [];

let currentPage = 1;
const pageSize = 10;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
  // 检查用户是否已登录
  if (!checkLogin()) {
    return;
  }
  
  // 初始化页面
  await initReportQueryPage();
});

// 初始化周报查询页面
async function initReportQueryPage() {
  // 显示用户信息
  displayUserInfo();
  
  // 设置导航权限
  setupNavigationPermissions();
  
  // 加载配置数据
  await loadConfigData();
  
  // 加载用户数据
  await loadUserData();
  
  // 加载周报数据
  await loadReportData();
  
  // 填充查询条件下拉框
  populateQuerySelects();
  
  // 设置事件监听
  setupEventListeners();
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

// 加载配置数据
async function loadConfigData() {
  try {
    const configData = JSON.parse(localStorage.getItem('config')) || {};
    config = {
      domains: configData.domains || [],
      brands: configData.brands || [],
      models: configData.models || [],
      baselines: configData.baselines || [],
      businessModules: configData.businessModules || []
    };
  } catch (error) {
    console.error('加载配置数据失败:', error);
  }
}

// 加载用户数据
async function loadUserData() {
  try {
    users = JSON.parse(localStorage.getItem('mockUsers')) || [];
  } catch (error) {
    console.error('加载用户数据失败:', error);
    users = [];
  }
}

// 加载周报数据
async function loadReportData() {
  try {
    let reportData = JSON.parse(localStorage.getItem('reports')) || [];
    
    // 如果不是管理员，只显示当前用户的周报
    const currentUser = getCurrentUser();
    if (!isAdmin()) {
      reports = reportData.filter(report => report.userId === currentUser.id);
    } else {
      reports = reportData;
    }
  
    // 按更新时间排序，最近的在前
    reports.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
    // 初始化筛选后的报告
    filteredReports = [...reports];
  } catch (error) {
    console.error('加载周报数据失败:', error);
    // 初始化默认值
    reports = [];
    filteredReports = [];
  }
}

// 填充查询条件下拉框
function populateQuerySelects() {
  // 填充用户下拉框
  populateUserSelect();
  
  // 填充域控下拉框
  populateDomainSelect();
  
  // 填充品牌下拉框
  populateBrandSelect();
  
  // 填充车型下拉框
  populateModelSelect();
  
  // 填充基线下拉框
  populateBaselineSelect();
}

// 填充用户下拉框
function populateUserSelect() {
  const userSelect = document.getElementById('queryUserId');
  
  // 如果是管理员，显示所有用户
  if (isAdmin()) {
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.username} (${user.name})`;
      userSelect.appendChild(option);
    });
  } else {
    // 如果不是管理员，只显示当前用户
    const currentUser = getCurrentUser();
    const option = document.createElement('option');
    option.value = currentUser.id;
    option.textContent = `${currentUser.username} (${currentUser.name})`;
    option.selected = true;
    userSelect.appendChild(option);
    
    // 禁用下拉框
    userSelect.disabled = true;
  }
}

// 填充域控下拉框
function populateDomainSelect() {
  const domainSelect = document.getElementById('queryDomainId');
  
  config.domains.forEach(domain => {
    const option = document.createElement('option');
    option.value = domain.id;
    option.textContent = domain.name;
    domainSelect.appendChild(option);
  });
}

// 填充品牌下拉框
function populateBrandSelect() {
  const brandSelect = document.getElementById('queryBrandId');
  
  config.brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.id;
    option.textContent = brand.name;
    brandSelect.appendChild(option);
  });
}

// 填充车型下拉框
function populateModelSelect() {
  const modelSelect = document.getElementById('queryModelId');
  
  config.models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    modelSelect.appendChild(option);
  });
}

// 填充基线下拉框
function populateBaselineSelect() {
  const baselineSelect = document.getElementById('queryBaselineId');
  
  config.baselines.forEach(baseline => {
    const option = document.createElement('option');
    option.value = baseline.id;
    option.textContent = baseline.name;
    baselineSelect.appendChild(option);
  });
}

// 设置事件监听
function setupEventListeners() {
  // 查询表单提交事件
  document.getElementById('queryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    queryReports();
  });
  
  // 重置按钮事件
  document.getElementById('resetBtn').addEventListener('click', function() {
    resetQueryForm();
  });
  
  // 导出为文本按钮事件
  document.getElementById('exportTextBtn').addEventListener('click', function() {
    exportReports('text');
  });
  
  // 导出为CSV按钮事件
  document.getElementById('exportCsvBtn').addEventListener('click', function() {
    exportReports('csv');
  });
  
  // 上一页按钮事件
  document.getElementById('prevPageBtn').addEventListener('click', function(e) {
    e.preventDefault();
    goToPrevPage();
  });
  
  // 下一页按钮事件
  document.getElementById('nextPageBtn').addEventListener('click', function(e) {
    e.preventDefault();
    goToNextPage();
  });
  
  // 关闭详情模态框按钮事件
  document.getElementById('closeDetailModalBtn').addEventListener('click', function() {
    closeDetailModal();
  });
  
  // 关闭详情按钮事件
  document.getElementById('closeDetailBtn').addEventListener('click', function() {
    closeDetailModal();
  });
  
  // 退出登录按钮事件
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 设置下拉菜单事件
  setupDropdownMenus();
  
  // 点击模态框外部关闭模态框
  window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('reportDetailModal')) {
      closeDetailModal();
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

// 查询周报
function queryReports() {
  // 获取查询条件
  const userId = document.getElementById('queryUserId').value;
  const domainId = document.getElementById('queryDomainId').value;
  const brandId = document.getElementById('queryBrandId').value;
  const modelId = document.getElementById('queryModelId').value;
  const baselineId = document.getElementById('queryBaselineId').value;
  const status = document.getElementById('queryStatus').value;
  const startDate = document.getElementById('queryStartDate').value;
  const endDate = document.getElementById('queryEndDate').value;
  
  // 筛选报告
  filteredReports = reports.filter(report => {
    // 用户筛选
    if (userId && report.userId !== userId) {
      return false;
    }
    
    // 域控筛选
    if (domainId && report.domainId !== domainId) {
      return false;
    }
    
    // 品牌筛选
    if (brandId && report.brandId !== brandId) {
      return false;
    }
    
    // 车型筛选
    if (modelId && report.modelId !== modelId) {
      return false;
    }
    
    // 基线筛选
    if (baselineId && report.baselineId !== baselineId) {
      return false;
    }
    
    // 状态筛选
    if (status && report.status !== status) {
      return false;
    }
    
    // 日期筛选
    if (startDate && new Date(report.startDate) < new Date(startDate)) {
      return false;
    }
    
    if (endDate && new Date(report.endDate) > new Date(endDate)) {
      return false;
    }
    
    return true;
  });
  
  // 重置当前页码
  currentPage = 1;
  
  // 渲染报告表格
  renderReportTable();
  
  // 更新分页
  updatePagination();
  
  // 更新报告数量
  document.getElementById('reportCount').textContent = `${filteredReports.length} 条记录`;
}

// 重置查询表单
function resetQueryForm() {
  // 重置表单
  document.getElementById('queryForm').reset();
  
  // 如果不是管理员，保持用户选择
  if (!isAdmin()) {
    const currentUser = getCurrentUser();
    document.getElementById('queryUserId').value = currentUser.id;
  }
  
  // 重置筛选后的报告
  filteredReports = [...reports];
  
  // 重置当前页码
  currentPage = 1;
  
  // 渲染报告表格
  renderReportTable();
  
  // 更新分页
  updatePagination();
  
  // 更新报告数量
  document.getElementById('reportCount').textContent = `${filteredReports.length} 条记录`;
}

// 渲染报告表格
function renderReportTable() {
  const tableBody = document.getElementById('reportTableBody');
  
  // 清空表格
  tableBody.innerHTML = '';
  
  // 如果没有报告数据，显示提示
  if (filteredReports.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" class="text-center">没有找到符合条件的周报</td>';
    tableBody.appendChild(row);
    
    // 隐藏分页
    document.getElementById('pagination').style.display = 'none';
    
    return;
  }
  
  // 计算分页
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredReports.length);
  const pageReports = filteredReports.slice(startIndex, endIndex);
  
  // 渲染报告数据
  pageReports.forEach(report => {
    const row = document.createElement('tr');
    
    // 获取用户信息
    const user = users.find(u => u.id === report.userId);
    const userName = user ? `${user.username} (${user.name})` : '未知用户';
    
    // 获取域控信息
    const domain = config.domains.find(d => d.id === report.domainId);
    const domainName = domain ? domain.name : '未知';
    
    // 获取品牌信息
    const brand = config.brands.find(b => b.id === report.brandId);
    const brandName = brand ? brand.name : '未知';
    
    // 获取车型信息
    const model = config.models.find(m => m.id === report.modelId);
    const modelName = model ? model.name : '未知';
    
    // 获取基线信息
    const baseline = config.baselines.find(b => b.id === report.baselineId);
    const baselineName = baseline ? baseline.name : '未知';
    
    // 设置状态标签
    const statusBadge = report.status === 'draft' 
      ? '<span class="badge badge-warning">草稿</span>' 
      : '<span class="badge badge-success">已提交</span>';
    
    // 格式化日期
    const updatedAt = formatDate(report.updatedAt);
    
    // 设置操作按钮
    const actions = `
      <button class="btn btn-sm btn-primary view-btn" data-id="${report.id}">查看</button>
      <a href="report-form.html?id=${report.id}" class="btn btn-sm btn-secondary edit-btn">编辑</a>
    `;
    
    row.innerHTML = `
      <td>${userName}</td>
      <td>${formatDate(report.startDate)} - ${formatDate(report.endDate)}</td>
      <td>${domainName}</td>
      <td>${brandName}</td>
      <td>${modelName}</td>
      <td>${baselineName}</td>
      <td>${statusBadge}</td>
      <td>${updatedAt}</td>
      <td>${actions}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // 设置查看和编辑按钮事件
  setupTableButtonEvents();
  
  // 显示分页
  document.getElementById('pagination').style.display = 'flex';
}

// 设置表格按钮事件
function setupTableButtonEvents() {
  // 查看按钮事件
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const reportId = this.dataset.id;
      viewReportDetail(reportId);
    });
  });
}

// 查看周报详情
function viewReportDetail(reportId) {
  // 获取报告
  const report = reports.find(r => r.id === reportId);
  
  if (!report) {
    showAlert('周报不存在或已被删除', 'danger');
    return;
  }
  
  // 检查权限（普通用户只能查看自己的周报）
  const currentUser = getCurrentUser();
  if (!isAdmin() && report.userId !== currentUser.id) {
    showAlert('您没有权限查看此周报', 'danger');
    return;
  }
  
  // 获取用户信息
  const user = users.find(u => u.id === report.userId);
  const userName = user ? `${user.username} (${user.name})` : '未知用户';
  
  // 获取域控信息
  const domain = config.domains.find(d => d.id === report.domainId);
  const domainName = domain ? domain.name : '未知';
  
  // 获取品牌信息
  const brand = config.brands.find(b => b.id === report.brandId);
  const brandName = brand ? brand.name : '未知';
  
  // 获取车型信息
  const model = config.models.find(m => m.id === report.modelId);
  const modelName = model ? model.name : '未知';
  
  // 获取基线信息
  const baseline = config.baselines.find(b => b.id === report.baselineId);
  const baselineName = baseline ? baseline.name : '未知';
  
  // 设置模态框标题
  document.getElementById('detailModalTitle').textContent = `周报详情 - ${formatDate(report.startDate)} 至 ${formatDate(report.endDate)}`;
  
  // 生成详情内容
  let detailContent = `
    <div class="mb-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p><strong>用户：</strong>${userName}</p>
          <p><strong>域控：</strong>${domainName}</p>
          <p><strong>品牌：</strong>${brandName}</p>
        </div>
        <div>
          <p><strong>车型：</strong>${modelName}</p>
          <p><strong>基线：</strong>${baselineName}</p>
          <p><strong>状态：</strong>${report.status === 'draft' ? '草稿' : '已提交'}</p>
        </div>
      </div>
    </div>
    <hr class="my-4">
    <h5 class="mb-3">工作内容</h5>
  `;
  
  // 如果没有工作内容，显示提示
  if (!report.content || report.content.length === 0) {
    detailContent += '<p class="text-muted">暂无工作内容</p>';
  } else {
    // 生成工作内容列表
    report.content.forEach(item => {
      // 获取业务模块信息
      const module = config.businessModules.find(m => m.id === item.moduleId);
      const moduleName = module ? module.name : '未知模块';
      
      detailContent += `
        <div class="mb-4 p-3 border rounded">
          <h6 class="mb-2">${moduleName}</h6>
          <div class="mb-2">
            <p><strong>工作内容：</strong>${item.workContent || '-'}</p>
          </div>
        </div>
      `;
    });
  }
  
  // 设置详情内容
  document.getElementById('reportDetailContent').innerHTML = detailContent;
  
  // 显示详情模态框
  document.getElementById('reportDetailModal').classList.add('show');
}

// 关闭详情模态框
function closeDetailModal() {
  document.getElementById('reportDetailModal').classList.remove('show');
}

// 更新分页
function updatePagination() {
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  
  // 如果只有一页，隐藏分页
  if (totalPages <= 1) {
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  
  // 显示分页
  document.getElementById('pagination').style.display = 'flex';
  
  // 更新上一页按钮状态
  document.getElementById('prevPageBtn').classList.toggle('disabled', currentPage === 1);
  
  // 更新下一页按钮状态
  document.getElementById('nextPageBtn').classList.toggle('disabled', currentPage === totalPages);
  
  // 生成页码
  const paginationNumbers = document.getElementById('paginationNumbers');
  paginationNumbers.innerHTML = '';
  
  // 最多显示5个页码
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  // 如果总页数少于5，调整起始和结束页码
  if (totalPages <= 5) {
    startPage = 1;
    endPage = totalPages;
  }
  
  // 添加页码
  for (let i = startPage; i <= endPage; i++) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.className = `pagination-link ${i === currentPage ? 'active' : ''}`;
    pageLink.textContent = i;
    pageLink.addEventListener('click', function(e) {
      e.preventDefault();
      goToPage(i);
    });
    
    const pageItem = document.createElement('div');
    pageItem.className = 'pagination-item';
    pageItem.appendChild(pageLink);
    
    paginationNumbers.appendChild(pageItem);
  }
}

// 跳转到指定页码
function goToPage(page) {
  if (page < 1 || page > Math.ceil(filteredReports.length / pageSize)) {
    return;
  }
  
  currentPage = page;
  renderReportTable();
  updatePagination();
}

// 跳转到上一页
function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderReportTable();
    updatePagination();
  }
}

// 跳转到下一页
function goToNextPage() {
  if (currentPage < Math.ceil(filteredReports.length / pageSize)) {
    currentPage++;
    renderReportTable();
    updatePagination();
  }
}

// 导出周报
function exportReports(format) {
  // 如果没有报告数据，显示提示
  if (filteredReports.length === 0) {
    showAlert('没有找到符合条件的周报', 'warning');
    return;
  }
  
  let content = '';
  let fileName = '';
  let mimeType = '';
  
  if (format === 'text') {
    // 生成文本格式
    content = generateTextReport();
    fileName = '周报查询结果.txt';
    mimeType = 'text/plain';
  } else if (format === 'csv') {
    // 生成CSV格式
    content = generateCsvReport();
    fileName = '周报查询结果.csv';
    mimeType = 'text/csv';
  }
  
  // 创建下载链接
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // 显示成功提示
  showAlert(`周报已成功导出为 ${fileName}`, 'success');
}

// 生成文本格式报告
function generateTextReport() {
  let content = `周报查询结果\n`;
  content += `查询时间：${formatDateTime(new Date())}\n`;
  content += `报告数量：${filteredReports.length} 条\n`;
  content += `\n`;
  
  filteredReports.forEach((report, index) => {
    // 获取用户信息
    const user = users.find(u => u.id === report.userId);
    const userName = user ? `${user.username} (${user.name})` : '未知用户';
    
    // 获取域控信息
    const domain = config.domains.find(d => d.id === report.domainId);
    const domainName = domain ? domain.name : '未知';
    
    // 获取品牌信息
    const brand = config.brands.find(b => b.id === report.brandId);
    const brandName = brand ? brand.name : '未知';
    
    // 获取车型信息
    const model = config.models.find(m => m.id === report.modelId);
    const modelName = model ? model.name : '未知';
    
    // 获取基线信息
    const baseline = config.baselines.find(b => b.id === report.baselineId);
    const baselineName = baseline ? baseline.name : '未知';
    
    content += `===========================================\n`;
    content += `报告 ${index + 1}\n`;
    content += `===========================================\n`;
    content += `用户：${userName}\n`;
    content += `日期范围：${formatDate(report.startDate)} - ${formatDate(report.endDate)}\n`;
    content += `域控：${domainName}\n`;
    content += `品牌：${brandName}\n`;
    content += `车型：${modelName}\n`;
    content += `基线：${baselineName}\n`;
    content += `状态：${report.status === 'draft' ? '草稿' : '已提交'}\n`;
    content += `更新时间：${formatDateTime(report.updatedAt)}\n`;
    content += `\n`;
    
    // 如果没有工作内容，显示提示
    if (!report.content || report.content.length === 0) {
      content += `工作内容：暂无\n`;
    } else {
      content += `工作内容：\n`;
      
      // 生成工作内容列表
      report.content.forEach(item => {
        // 获取业务模块信息
        const module = config.businessModules.find(m => m.id === item.moduleId);
        const moduleName = module ? module.name : '未知模块';
        
        content += `  ${moduleName}：\n`;
        content += `    工作内容：${item.workContent || '-'}\n`;
        
        content += `\n`;
      });
    }
    
    content += `\n`;
  });
  
  return content;
}

// 生成CSV格式报告
function generateCsvReport() {
  // CSV头部
  let content = '用户,日期范围,域控,品牌,车型,基线,状态,更新时间,业务模块,工作内容\n';
  
  filteredReports.forEach(report => {
    // 获取用户信息
    const user = users.find(u => u.id === report.userId);
    const userName = user ? `${user.username} (${user.name})` : '未知用户';
    
    // 获取域控信息
    const domain = config.domains.find(d => d.id === report.domainId);
    const domainName = domain ? domain.name : '未知';
    
    // 获取品牌信息
    const brand = config.brands.find(b => b.id === report.brandId);
    const brandName = brand ? brand.name : '未知';
    
    // 获取车型信息
    const model = config.models.find(m => m.id === report.modelId);
    const modelName = model ? model.name : '未知';
    
    // 获取基线信息
    const baseline = config.baselines.find(b => b.id === report.baselineId);
    const baselineName = baseline ? baseline.name : '未知';
    
    // 日期范围
    const dateRange = `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
    
    // 状态
    const status = report.status === 'draft' ? '草稿' : '已提交';
    
    // 更新时间
    const updatedAt = formatDateTime(report.updatedAt);
    
    // 如果没有工作内容，添加一行空数据
    if (!report.content || report.content.length === 0) {
      const row = [
          escapeCsvField(userName),
          escapeCsvField(dateRange),
          escapeCsvField(domainName),
          escapeCsvField(brandName),
          escapeCsvField(modelName),
          escapeCsvField(baselineName),
          escapeCsvField(status),
          escapeCsvField(updatedAt),
          '',
          ''
        ].join(',');
      
      content += row + '\n';
    } else {
      // 为每个业务模块添加一行数据
      report.content.forEach(item => {
        // 获取业务模块信息
        const module = config.businessModules.find(m => m.id === item.moduleId);
        const moduleName = module ? module.name : '未知模块';
        
        const row = [
          escapeCsvField(userName),
          escapeCsvField(dateRange),
          escapeCsvField(domainName),
          escapeCsvField(brandName),
          escapeCsvField(modelName),
          escapeCsvField(baselineName),
          escapeCsvField(status),
          escapeCsvField(updatedAt),
          escapeCsvField(moduleName),
          escapeCsvField(item.workContent || '')
        ].join(',');
        
        content += row + '\n';
      });
    }
  });
  
  return content;
}

// CSV字段转义
function escapeCsvField(field) {
  if (typeof field !== 'string') {
    return field;
  }
  
  // 如果字段包含逗号、引号或换行符，需要用引号包裹
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    // 替换双引号为两个双引号
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
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

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
}

// 格式化日期时间
function formatDateTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
}

// 数字补零
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}
