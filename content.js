// content.js
// 监听来自背景脚本的注入请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "executeFunction") {
    const { funcName, args } = request;
    if (window[funcName]) {
      window[funcName](...args);
    } else {
      console.error(`函数 ${funcName} 未找到`);
    }
  }
});