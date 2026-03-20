// MongoDB initialization script
// Runs once on first database creation (docker-entrypoint-initdb.d)
// Creates a superadmin user in user_db

db = db.getSiblingDB('user_db');

var adminEmail = 'fsdfdsfsdf76@gmail.com';
var existing = db.User.findOne({ email: adminEmail });

if (!existing) {
    var now = new Date().toISOString();
    // Beanie stores UUID as a plain string (_id field)
    var adminId = UUID().toString().replace(/^UUID\("(.+)"\)$/, '$1');
    // Fallback: generate a v4-like UUID string manually
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    var newId = uuidv4();

    db.User.insertOne({
        _id: newId,
        email: adminEmail,
        nickname: 'superadmin',
        role: 'superadmin',
        status: 'active',
        created_at: now,
        last_updated: now
    });
    print('[init] Created superadmin user: ' + adminEmail + ' (id=' + newId + ')');
} else {
    print('[init] Superadmin user already exists: ' + adminEmail);
    // Ensure role is superadmin
    db.User.updateOne({ email: adminEmail }, { $set: { role: 'superadmin' } });
}
