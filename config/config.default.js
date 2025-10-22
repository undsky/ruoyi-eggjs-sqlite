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
