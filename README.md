# ruoyi-eggjs-sqlite

> Egg plugin for sqlite

基于 [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) 的 Egg.js SQLite 插件，提供简单易用的 SQLite 数据库操作接口。

## 特性

- ✅ 支持单实例和多实例配置
- ✅ 提供简洁的 API 封装（select、insert、update、delete）
- ✅ 内置事务支持，自动回滚
- ✅ 开发环境自动打印 SQL 执行时间
- ✅ 错误信息包含执行的 SQL 语句

## 安装

```bash
$ npm i ruoyi-eggjs-sqlite --save
```

## 支持的 egg 版本

| egg 3.x | egg 2.x | egg 1.x |
| ------- | ------- | ------- |
| 😁      | 😁      | ❌      |

## 开启插件

```js
// {app_root}/config/plugin.js
exports.sqlite = {
  enable: true,
  package: "ruoyi-eggjs-sqlite",
};
```

## 配置

### 单实例

```js
// {app_root}/config/config.default.js
config.sqlite = {
  client: {
    path: path.join(appInfo.baseDir, 'database.db'),
    options: {
      // better-sqlite3 选项
      // readonly: false,
      // fileMustExist: false,
      // timeout: 5000,
      // verbose: console.log
    },
  },
};
```

### 多实例

```js
// {app_root}/config/config.default.js
config.sqlite = {
  clients: {
    db1: {
      path: path.join(appInfo.baseDir, 'db1.db'),
      options: null,
    },
    db2: {
      path: path.join(appInfo.baseDir, 'db2.db'),
      options: null,
    },
  },
};
```

### 内存数据库

```js
config.sqlite = {
  client: {
    path: ":memory:",
    options: null,
  },
};
```

## 使用方法

### 单实例

```js
// 在 controller 或 service 中使用
const { app } = this;

// 单条查询
const user = await app.sqlite.select('SELECT * FROM users WHERE id = 1');

// 多条查询
const users = await app.sqlite.selects('SELECT * FROM users WHERE age > 18');

// 插入数据（返回新插入行的 rowid）
const rowid = await app.sqlite.insert("INSERT INTO users (name, age) VALUES ('张三', 25)");

// 更新数据（返回影响的行数）
const changes = await app.sqlite.update("UPDATE users SET age = 26 WHERE id = 1");

// 删除数据（返回影响的行数）
const deleted = await app.sqlite.del("DELETE FROM users WHERE id = 1");

// 执行 SQL
await app.sqlite.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
```

### 多实例

```js
const db1 = app.sqlite.get('db1');
const db2 = app.sqlite.get('db2');

const user = await db1.select('SELECT * FROM users WHERE id = 1');
const order = await db2.select('SELECT * FROM orders WHERE id = 1');
```

## API 说明

### select(sql)

执行单条查询，返回第一行数据。

```js
const user = await app.sqlite.select('SELECT * FROM users WHERE id = 1');
// 返回: { id: 1, name: '张三', age: 25 } 或 undefined
```

### selects(sql)

执行多条查询，返回所有匹配的行。

```js
const users = await app.sqlite.selects('SELECT * FROM users');
// 返回: [{ id: 1, name: '张三', age: 25 }, { id: 2, name: '李四', age: 30 }]
```

### insert(sql)

执行插入操作，返回新插入行的 `rowid`。

```js
const rowid = await app.sqlite.insert("INSERT INTO users (name, age) VALUES ('王五', 28)");
// 返回: 3 (新插入行的 ID)
```

### update(sql)

执行更新操作，返回受影响的行数。

```js
const changes = await app.sqlite.update("UPDATE users SET age = 26 WHERE id = 1");
// 返回: 1 (受影响的行数)
```

### del(sql)

执行删除操作，返回受影响的行数（实际是 `update` 的别名）。

```js
const deleted = await app.sqlite.del("DELETE FROM users WHERE age < 18");
// 返回: 2 (删除的行数)
```

### run(sql)

执行任意 SQL 语句，返回执行结果对象。

```js
const result = await app.sqlite.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
// 返回: { changes: 0, lastInsertRowid: 0 }
```

### transaction(sqls)

执行事务，传入 SQL 数组，全部成功则提交，任一失败则自动回滚。

```js
const results = await app.sqlite.transaction([
  "INSERT INTO users (name, age) VALUES ('张三', 25)",
  "INSERT INTO users (name, age) VALUES ('李四', 30)",
  "UPDATE users SET age = 26 WHERE name = '张三'",
]);
// 返回: [{ changes: 1, lastInsertRowid: 1 }, { changes: 1, lastInsertRowid: 2 }, { changes: 1, lastInsertRowid: 0 }]
```

如果事务中任何一条 SQL 执行失败，所有更改会自动回滚：

```js
try {
  await app.sqlite.transaction([
    "INSERT INTO users (name, age) VALUES ('张三', 25)",
    "INSERT INTO invalid_table (name) VALUES ('test')", // 这条会失败
  ]);
} catch (error) {
  console.log(error.sqls); // 包含所有执行的 SQL
  // 第一条插入会被自动回滚
}
```

### connection

获取原始的 better-sqlite3 连接对象，用于高级操作。

```js
const db = app.sqlite.connection;
const stmt = db.prepare('SELECT * FROM users WHERE age > ?');
const users = stmt.all(18);
```

## 开发调试

在非生产环境下，插件会自动在控制台打印每条 SQL 的执行时间：

```
SELECT * FROM users WHERE id = 1: 0.123ms
INSERT INTO users (name, age) VALUES ('张三', 25): 0.456ms
```

## 完整示例

```js
// app/service/user.js
const { Service } = require('egg');

class UserService extends Service {
  async createTable() {
    await this.app.sqlite.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async create(name, age) {
    const rowid = await this.app.sqlite.insert(
      `INSERT INTO users (name, age) VALUES ('${name}', ${age})`
    );
    return rowid;
  }

  async findById(id) {
    return await this.app.sqlite.select(
      `SELECT * FROM users WHERE id = ${id}`
    );
  }

  async findAll() {
    return await this.app.sqlite.selects('SELECT * FROM users ORDER BY id DESC');
  }

  async update(id, data) {
    const changes = await this.app.sqlite.update(
      `UPDATE users SET name = '${data.name}', age = ${data.age} WHERE id = ${id}`
    );
    return changes > 0;
  }

  async delete(id) {
    const deleted = await this.app.sqlite.del(`DELETE FROM users WHERE id = ${id}`);
    return deleted > 0;
  }

  async batchCreate(users) {
    const sqls = users.map(user => 
      `INSERT INTO users (name, age) VALUES ('${user.name}', ${user.age})`
    );
    return await this.app.sqlite.transaction(sqls);
  }
}

module.exports = UserService;
```

## 注意事项

1. **SQL 注入防护**：示例中为了简洁使用了字符串拼接，生产环境建议使用参数化查询或做好输入验证
2. **同步 API**：better-sqlite3 使用同步 API，但在 Egg.js 中可以直接使用 async/await
3. **数据库文件路径**：确保数据库文件所在目录有写入权限
4. **性能考虑**：SQLite 适合中小型应用，大规模并发写入建议使用 MySQL/PostgreSQL

## 相关链接

- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3/wiki)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)

---

## 关于 ruoyi-eggjs 项目

本插件是 [ruoyi-eggjs](https://github.com/undsky/ruoyi-eggjs) 项目的核心组件之一。

**ruoyi-eggjs** 是一个基于 Egg.js 的企业级后台管理系统，参照若依（RuoYi）架构设计，提供完善的权限管理、用户管理、系统监控等功能，是快速开发企业级应用的最佳选择。

### 主要特性

- 🎯 **完整的权限系统**：基于 RBAC 的权限控制，支持细粒度权限管理
- 🚀 **开箱即用**：集成常用功能模块，快速启动项目开发
- 🔧 **MyBatis 风格**：采用 XML 风格的 SQL 编写，熟悉的开发体验
- 📦 **模块化设计**：松耦合的插件体系，按需使用
- 🛡️ **企业级安全**：XSS 防护、SQL 注入防护、访问控制等
- 📊 **系统监控**：在线用户、登录日志、操作日志、定时任务等

### 项目地址

- GitHub: [https://github.com/undsky/ruoyi-eggjs](https://github.com/undsky/ruoyi-eggjs)
- Gitee: [https://gitee.com/undsky/ruoyi-eggjs](https://gitee.com/undsky/ruoyi-eggjs)

### 相关插件

- [ruoyi-eggjs-cache](https://github.com/undsky/ruoyi-eggjs-cache) - 缓存插件
- [ruoyi-eggjs-mybatis](https://github.com/undsky/ruoyi-eggjs-mybatis) - MyBatis 集成
- [ruoyi-eggjs-mysql](https://github.com/undsky/ruoyi-eggjs-mysql) - MySQL 连接
- [ruoyi-eggjs-ratelimiter](https://github.com/undsky/ruoyi-eggjs-ratelimiter) - 限流插件
- [ruoyi-eggjs-sqlite](https://github.com/undsky/ruoyi-eggjs-sqlite) - SQLite 支持
- [ruoyi-eggjs-handlebars](https://github.com/undsky/ruoyi-eggjs-handlebars) - Handlebars 模板

### 联系方式

- 📮 **Issues**: [提交问题或建议](https://github.com/undsky/ruoyi-eggjs/issues)
- 🌐 **官网**: [https://www.undsky.com](https://www.undsky.com)
- 💬 **讨论**: [GitHub Discussions](https://github.com/undsky/ruoyi-eggjs/discussions)

### 贡献指南

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给我们一个 ⭐️ Star 支持一下！

---

## License

[MIT](LICENSE)
