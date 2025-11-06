/*
 * @Author: 姜彦汐
 * @Date: 2021-04-21 16:24:04
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2022-02-24 15:29:36
 * @Description:
 * @Site: https://www.undsky.com
 */
module.exports = (appInfo) => ({
  sqlite: {
    default: {
      path: ":memory:",
      options: null,
    },
    // 是否自动将查询结果的字段名从下划线命名转换为驼峰命名
    // 例如: user_name -> userName, created_at -> createdAt
    // 默认值: false (保持向后兼容)
    camelCase: false,
    // Single
    // client: {

    // },
    // Multi
    // clients: {
    //     sqlite1: {

    //     },
    //     sqlite2: {

    //     }
    // }
  },
});
