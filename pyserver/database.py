import psycopg2

from envReader import getBoolean, getValue

class database:
    def __init__(self):
        self.conn = psycopg2.connect(database=getValue('DB_NAME'), user=getValue('DB_USER'), password=getValue('DB_PASSWORD'), host=getValue('DB_HOST'))
        self.cur = self.conn.cursor()

        if getBoolean('INIT_DB') == True:
            self.initDB()
    
    def initDB(self):
        #Delete old tables
        query = "DROP TABLE IF EXISTS accounts"
        self.cur.execute(query)
        self.conn.commit()

        query = 'CREATE TABLE accounts(username TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, uuid TEXT, pin TEXT)'
        self.cur.execute(query)
        self.conn.commit()

        res = self.addAccount('admin', 'test@test.com', 'admin')
        print('res:', res)
    
    def addAccount(self, username, email, password):
        if not username or len(username) <= 0 or not email or len(email) <= 0 or not password or len(password) <= 0:
            return "Empty or invalid credentials!"

        if self.usernameExists(username) == True:
            return "Username already exists!"

        if self.emailExists(email) == True:
            return "Email already exists!"

        query = "INSERT INTO accounts (username, email, password, pin) VALUES (%s, %s, %s, %s)"
        self.cur.execute(query, (username, email, password, None))
        self.conn.commit()
        return 'ok'
        
    def usernameExists(self, username):
        query = "SELECT * FROM accounts WHERE username = %s"
        self.cur.execute(query, (username,))
        rows = self.cur.fetchall()

        return len(rows) > 0

    def emailExists(self, email):
        query = "SELECT * FROM accounts WHERE email = %s"
        self.cur.execute(query, (email,))
        rows = self.cur.fetchall()

        return len(rows) > 0

    def login(self, username, password):
        if not username or len(username) <= 0 or not password or len(password) <= 0:
            return "Empty or invalid credentials!"

        query = "SELECT * FROM accounts WHERE username = %s AND password = %s"
        self.cur.execute(query, (username, password))
        rows = self.cur.fetchall()
        print(rows)

        if len(rows) > 0:
            return "ok"
        else:
            return "Invalid credentials!"

    def loginWithPin(self, username, pin):
        query = "SELECT * FROM accounts WHERE username = %s AND pin = %s"
        self.cur.execute(query, (username, pin))
        rows = self.cur.fetchall()

        if len(rows) > 0:
            return rows[0]['username']
        else:
            return "Invalid credentials!"

    def useHasPin_uuid(self, uuid):
        query = "SELECT * FROM accounts WHERE uuid = %s AND pin IS NOT NULL"
        self.cur.execute(query, (uuid,))
        rows = self.cur.fetchall()

        return  len(rows) > 0
        
    def userHasPin(self, username):
        query = "SELECT * FROM accounts WHERE username = %s AND pin IS NOT NULL"
        self.cur.execute(query, (username,))
        rows = self.cur.fetchall()

        return len(rows) > 0

    def setUserPin(self, username, pin):
        query = "UPDATE accounts SET pin = %s WHERE username = %s"
        self.cur.execute(query, (pin, username))
        self.conn.commit()