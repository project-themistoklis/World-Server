using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LiteNetLib;
using LiteNetLib.Utils;
using MySql.Data;
using MySql.Data.MySqlClient;

public class Database : MonoBehaviour
{
    public static Database getInstance;
    void Awake() { getInstance = this; }

    [SerializeField] string host;
    [SerializeField] string database;
    [SerializeField] string user;
    [SerializeField] string password;
    Dictionary<string, string> DefaultSettings { get { return new Dictionary<string, string>(); } }

    MySqlConnection con;

    void Start()
    {
        con = new MySqlConnection("Server=" + host + ";Database=" + database + ";User=" + user + ";Password=" + password + ";Pooling=False");
        con.Open();
    }

    public RequestResponse Login(string username, string password)
    {
        if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
        {
            string query = "SELECT * FROM accounts WHERE username='" + username + "' AND password='" + password + "'";
            MySqlCommand cmd = new MySqlCommand(query, con);
            MySqlDataReader reader = cmd.ExecuteReader();
            bool exists = reader.Read();
            reader.Close();
            return exists ? RequestResponse.OK : RequestResponse.Error;
        }

        return RequestResponse.Error;
    }

    public RequestResponse Register(string username, string password)
    {
        if (AccountExists(username))
            return RequestResponse.Error;

        string query = "INSERT INTO accounts(username, password) VALUES('" + username + "', '" + password + "')";
        MySqlCommand cmd = new MySqlCommand(query, con);
        cmd.ExecuteNonQuery();

        query = "INSERT INTO account_settings(username, settings) VALUES('" + username + "', '" + SettingsToStr(DefaultSettings) + "')";
        cmd = new MySqlCommand(query, con);
        cmd.ExecuteNonQuery();

        return RequestResponse.OK;
    }

    public bool AccountExists(string username)
    {
        string query = "SELECT * FROM accounts WHERE username='" + username + "'";
        MySqlCommand cmd = new MySqlCommand(query, con);
        MySqlDataReader reader = cmd.ExecuteReader();
        bool exists = reader.Read();
        reader.Close();
        return exists;
    }

    public Dictionary<string, string> GetAccountSettings(string username)
    {
        Dictionary<string, string> res = new Dictionary<string, string>();

        string query = "SELECT * FROM account_settings WHERE username='" + username + "'";
        MySqlCommand cmd = new MySqlCommand(query, con);
        MySqlDataReader reader = cmd.ExecuteReader();

        if (reader.Read())
        {
            string settings = reader.GetString(reader.GetOrdinal("settings"));
            res = StrToSettings(settings);
        }
        else
            res = DefaultSettings;

        return res;
    }

    public void UpdateAccountSettings(string username, Dictionary<string, string> settings)
    {
        string query = "UPDATE account_settings SET settings='" + SettingsToStr(settings) + "' WHERE username='" + username + "'";
        MySqlCommand cmd = new MySqlCommand(query, con);
        cmd.ExecuteNonQuery();
    }

    string SettingsToStr(Dictionary<string, string> settings)
    {
        string res = "";

        foreach (var c in settings)
            res += c.Key + "=" + c.Value + "|";

        return res;
    }
    Dictionary<string, string> StrToSettings(string settings)
    {
        Dictionary<string, string> res = new Dictionary<string, string>();

        string[] s = settings.Split("|");
        for (int i = 0; i < s.Length; i++)
        {
            string[] kv = s[i].Split("=");
            string key = kv[0];
            string value = kv[1];
            if (res.ContainsKey(key))
                continue;

            res.Add(key, value);
        }

        return res;
    }
}