// Background script for Chrome Extension

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 打开侧边栏
  chrome.sidePanel.open({ windowId: tab.windowId })
})

// 安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('备忘录扩展已安装')
})
