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

function init(config, app) {
  const connection = new Sqlite3(config.path, config.options);
  const prod = "prod" == app.config.env;

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
    return _run(sql, "get");
  }

  function selects(sql) {
    return _run(sql, "all");
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
