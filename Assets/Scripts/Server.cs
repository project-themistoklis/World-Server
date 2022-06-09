using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LiteNetLib;
using LiteNetLib.Utils;

public class Server : MonoBehaviour
{
    public static Server getInstance;
    void Awake() { getInstance = this; }

    [SerializeField] int port;
    [SerializeField] [Tooltip("Set to -1 to disable")] int maxClients = -1;
    [SerializeField] string connectionKey;

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

            RequestResponse resp = RequestResponse.OK;

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                resp = RequestResponse.Error;

            NetDataWriter writer = new NetDataWriter();
            writer.Put((ushort)Packets.Login);
            writer.Put((ushort)resp);

            SendPacket(writer, peer, DeliveryMethod.ReliableOrdered);
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
}

public enum RequestResponse
{
    OK = 0,
    Error = 1,
}