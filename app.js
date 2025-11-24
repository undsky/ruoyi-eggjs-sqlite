/*
 * @Author: 姜彦汐
 * @Date: 2020-11-23 11:05:30
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2022-06-04 21:32:20
 * @Description:
 * @Site: https://www.undsky.com
 */
const Sqlite3 = require("better-sqlite3");

module.exports = (app) => {
  app.addSingleton("sqlite", init);
};

/**
 * 将下划线命名转换为驼峰命名
 * @param {string} str - 下划线命名的字符串
 * @returns {string} 驼峰命名的字符串
 */
function toCamelCase(str) {
  // 判断是否全是大写字母（忽略下划线和数字）
  const isAllUpperCase = /^[A-Z0-9_]+$/.test(str);
  
  // 如果全是大写，先转为小写
  const normalizedStr = isAllUpperCase ? str.toLowerCase() : str;
  
  // 将下划线后的字母转为大写
  return normalizedStr.replace(/_([a-zA-Z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * 将对象的键从下划线命名转换为驼峰命名
 * @param {object} obj - 原始对象
 * @returns {object} 转换后的对象
 */
function convertKeysToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  }

  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

function init(config, app) {
  const connection = new Sqlite3(config.path, config.options);
  const prod = "prod" == app.config.env;
  
  // 获取驼峰命名转换配置，默认为 false（保持向后兼容）
  const camelCase = app.config.sqlite.camelCase !== undefined 
    ? app.config.sqlite.camelCase 
    : false;

  function _run(sql, func) {
    if (!prod) console.time(sql);
    try {
      return connection.prepare(sql)[func]();
    } catch (error) {
      error.sql = sql;
      throw error;
    } finally {
      if (!prod) console.timeEnd(sql);
    }
  }

  function select(sql) {
    const results = _run(sql, "all");
    const result = (results && results.length > 0) ? (results.length == 1 ? results[0] : results) : null;
    // 根据配置决定是否转换为驼峰命名
    return result ? (camelCase ? convertKeysToCamelCase(result) : result) : null;
  }

  function selects(sql) {
    const results = _run(sql, "all");
    // 根据配置决定是否转换为驼峰命名
    return camelCase ? convertKeysToCamelCase(results) : results;
  }

  function insert(sql) {
    return _run(sql, "run").lastInsertRowid;
  }

  function update(sql) {
    return _run(sql, "run").changes;
  }

  function run(sql) {
    return _run(sql, "run");
  }

  function transaction(sqls) {
    if (!prod) console.time(sqls);
    try {
      let results = [];
      connection.prepare("BEGIN").run();
      for (const sql of sqls) {
        results.push(run(sql));
      }
      connection.prepare("COMMIT").run();
      return results;
    } catch (error) {
      connection.prepare("ROLLBACK").run();
      error.sqls = sqls;
      throw error;
    } finally {
      if (!prod) console.timeEnd(sqls);
    }
  }

  return {
    connection,
    select,
    selects,
    insert,
    update,
    del: update,
    run,
    transaction,
  };
}
