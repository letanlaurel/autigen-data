// background.js
const dataTypes = [
  { id: 'autogen', title: '🔮 AutoGen-Fill' },
  { id: 'name', title: '姓名' },
  { id: 'name_en', title: '英文名' }, // 新增
  { id: 'phone', title: '手机号' },
  { id: 'idcard', title: '身份证号' },
  { id: 'company', title: '企业名称' },
  { id: 'company_en', title: '英文公司名' }, // 新增
  { id: 'uscc', title: '统一社会信用代码' },
  { id: 'email', title: '邮箱' },
  { id: 'address', title: '地址' },
  { id: 'address_en', title: '英文地址' }, // 新增
  { id: 'date', title: '日期' }
];

// 创建右键菜单
dataTypes.forEach((type) => {
  chrome.contextMenus.create({
    id: type.id,
    title: type.title,
    contexts: ["editable"],
    documentUrlPatterns: ["<all_urls>"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 第一步：注入核心逻辑
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['injected.js']
    });
    console.log('核心脚本注入成功');

    // 第二步：执行功能
    if (info.menuItemId === 'autogen') {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.autoFillAllFields()
      });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [info.menuItemId],
        func: (type) => window.fillSelectedField(type)
      });
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
});