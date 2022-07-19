using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Net.Mail;
using System.Net;

public class NotificationManager : MonoBehaviour
{
    public static NotificationManager getInstance;
    void Awake() { getInstance = this; }

    [Header("SMS")]
    [SerializeField] string twilioAccountSID;
    [SerializeField] string twilioAuthToken;
    [SerializeField] string twilioNumber;
    [Header("Email")]
    [SerializeField] string smtpHost = "smtp.gmail.com";
    [SerializeField] int smptPort = 587;
    [SerializeField] bool enableSsl = true;
    [SerializeField] string email;
    [SerializeField] string password;

    bool twilioEnabled = false;
    SmtpClient smptClient;

    void Start()
    {

        if (string.IsNullOrEmpty(twilioAccountSID) || string.IsNullOrEmpty(twilioAuthToken) || string.IsNullOrEmpty(twilioNumber))
            Debug.LogWarning("Missing twilio credentials!");
        else
        {
            TwilioClient.Init(twilioAccountSID, twilioAuthToken);
            twilioEnabled = true;
        }
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            Debug.LogWarning("Missing email credentials!");
        else
        {
            smptClient = new SmtpClient(smtpHost)
            {
                Port = smptPort,
                Credentials = new NetworkCredential(email, password),
                EnableSsl = enableSsl
            };
        }
    }

    public void SendSMS(string number, string text)
    {
        if (string.IsNullOrEmpty(number) || string.IsNullOrEmpty(text) || !twilioEnabled)
            return;

        MessageResource message = MessageResource.Create(body: text, from: new Twilio.Types.PhoneNumber(twilioNumber), to: new Twilio.Types.PhoneNumber(number));
        Debug.Log(message.Sid);
    }
    public void SendEmail(string to, string subject, string text)
    {
        if (string.IsNullOrEmpty(to) || string.IsNullOrEmpty(subject) || string.IsNullOrEmpty(text) || smptClient == null)
            return;

        smptClient.Send(email, to, subject, text);
    }
}
