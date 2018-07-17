import socket

TCP_IP = '0.0.0.0'
TCP_PORT = 6000
BUFFER_SIZE = 1024  # Normally 1024, but we want fast response

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((TCP_IP, TCP_PORT))
s.listen(1)

sdp_response = "RTSP/1.0 200 OK\r\n" +\
    "CSeq: 1\r\n" +\
    "Server: Wowza Streaming Engine 4.7.5 build21763\r\n" +\
    "Cache-Control: no-cache\r\n" +\
    "Content-Length: 596\r\n" +\
    "Content-Base: rtsp://192.168.0.174:6000\r\n" +\
    "Content-Type: application/sdp\r\n\r\n" +\
    "v=0\r\n" +\
    "o=- 829515158 829515158 IN IP4 127.0.0.1\r\n" +\
    "s=bunny.stream\r\n" +\
    "t=0 0\r\n" +\
    "a=sdplang:en\r\n" +\
    "a=range:npt=now\r\n" +\
    "a=control:*\r\n" +\
    "m=audio 5006 RTP/AVP 96\r\n" +\
    "c=IN IP4 239.0.0.1/63\r\n" +\
    "a=rtpmap:96 mpeg4-generic/48000/2\r\n" +\
    "a=fmtp:96 profile-level-id=1;mode=AAC-hbr;sizelength=13;indexlength=3;indexdeltalength=3;config=1190\r\n" +\
    "a=control:trackID=1\r\n" +\
    "m=video 5004 RTP/AVP 97\r\n" +\
    "c=IN IP4 239.0.0.1/63\r\n" +\
    "a=rtpmap:97 H264/90000\r\n" +\
    "a=fmtp:97 packetization-mode=1;profile-level-id=42C01E;sprop-parameter-sets=Z0LAHtkDxWhAAAADAEAAAAwDxYuS,aMuMsg==\r\n" +\
    "a=cliprect:0,0,160,240\r\n" +\
    "a=framesize:97 240-160\r\n" +\
    "a=framerate:24.0\r\n" +\
    "a=control:trackID=2\r\n"

conn, addr = s.accept()
print('Connection address:', addr)
while 1:
    data = conn.recv(BUFFER_SIZE)
    if not data: break
    print("received data:", data)
    conn.send(sdp_response.encode())
conn.close()
