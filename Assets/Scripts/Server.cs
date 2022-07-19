using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LiteNetLib;
using LiteNetLib.Utils;
using UnityEngine.Networking;

public class Server : MonoBehaviour
{
    public static Server getInstance;
    void Awake() { getInstance = this; }

    [SerializeField] int port;
    [SerializeField] [Tooltip("Set to -1 to disable")] int maxClients = -1;
    [SerializeField] string connectionKey;
    [SerializeField] string modelHolderUrl = "";

    EventBasedNetListener listener;
    NetManager server;

    void Start()
    {
        listener = new EventBasedNetListener();
        server = new NetManager(listener);
        server.Start(port);
        listener.ConnectionRequestEvent += ConnectionRequestEvent;
        listener.PeerConnectedEvent += PeerConnectedEvent;
        listener.NetworkReceiveEvent += NetworkReceiveEvent;
    }

    void Update()
    {
        if (server != null)
            server.PollEvents();
    }

    void NetworkReceiveEvent(NetPeer peer, NetPacketReader reader, byte channel, DeliveryMethod deliveryMethod)
    {
        Packets packet = (Packets)reader.GetUShort();
        if (packet == Packets.Login)
        {
            string username = reader.GetString();
            string password = reader.GetString();

            RequestResponse resp = Database.getInstance.Login(username, password);
            Dictionary<string, string> settings = new Dictionary<string, string>();
            if (resp == RequestResponse.OK)
                settings = Database.getInstance.GetAccountSettings(username);

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                resp = RequestResponse.Error;

            NetDataWriter writer = new NetDataWriter();
            writer.Put((ushort)Packets.Login);
            writer.Put((ushort)resp);

            writer.Put(settings.Count);
            foreach (var s in settings)
            {
                writer.Put(s.Key);
                writer.Put(s.Value);
            }

            SendPacket(writer, peer, DeliveryMethod.ReliableOrdered);
        }
        else if (packet == Packets.Image)
        {
            string base64 = reader.GetString();

            StartCoroutine(SendImageToServer(base64));
        }
    }

    IEnumerator SendImageToServer(string base64)
    {
        Dictionary<string, string> formData = new Dictionary<string, string>();
        formData.Add("image", base64);

        using (UnityWebRequest www = UnityWebRequest.Post(modelHolderUrl + "/detect", formData))
        {
            yield return www.SendWebRequest();

            if (www.isError)
                Debug.Log(www.error);
        }
    }

    void PeerConnectedEvent(NetPeer peer)
    {
        NetDataWriter writer = new NetDataWriter();
        writer.Put((ushort)Packets.Welcome);
        writer.Put(peer.Id);
        SendPacket(writer, peer, DeliveryMethod.ReliableOrdered);
    }

    void ConnectionRequestEvent(ConnectionRequest request)
    {
        if (maxClients == 0)
            request.Reject();
        else if (maxClients < 0)
            request.AcceptIfKey(connectionKey);
    }

    void SendPacket(NetDataWriter writer, NetPeer peer, DeliveryMethod method)
    {
        peer.Send(writer, method);
    }
}

public enum Packets
{
    Welcome = 0,
    Login = 1,
    Image = 2,
}

public enum RequestResponse
{
    OK = 0,
    Error = 1,
}