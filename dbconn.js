const mariadb = require('mariadb');

let option = {
    host: "",
    port: "",
    user: "",
    password: "",
    database: ""
}
module.exports.stablishedConnection = () => {
    return new Promise(async (resolve, reject) => {
        const con = await mariadb.createConnection(option);
        if (con)
            resolve(con);
        else
            reject('')
    })
}
module.exports.closeDbConnection = (con) => {
    con.destroy();
}