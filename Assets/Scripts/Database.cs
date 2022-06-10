using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LiteNetLib;
using LiteNetLib.Utils;

public class Database : MonoBehaviour
{
    public static Database getInstance;
    void Awake() { getInstance = this; }

    Dictionary<string, string> DefaultSettings { get { return new Dictionary<string, string>(); } }

    public RequestResponse Login(string username, string password)
    {
        if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            return RequestResponse.OK;

        return RequestResponse.Error;
    }

    public Dictionary<string, string> GetAccountSettings(string username)
    {
        Dictionary<string, string> res = new Dictionary<string, string>();

        res = DefaultSettings;
        return res;
    }

}