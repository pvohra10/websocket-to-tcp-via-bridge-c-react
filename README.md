# C++ Backend TCP Server Connected to React Typescript Frontend Via Bridge.cjs Websockets

- TCP Server is blocking when listening on its port (9000) then switches to non-blocking for data transmissiono
- Bridge.cjs listens for react frontend on port 8080 and connects to C++ server TCP socket on 9000
- React Server uses functions in src/TcpBridgecomponent.tsx to communicate with bridge via websocket
- All three can he launched via bat file (Link.bat) in correct order:
  - (React Frontend First -> C++ Server start (takes a sec to create socket addr and bind and  wait) -> Delay -> Bridge.cjs -> Bridge connets to c++ -> Bridge connects to react frontend -> Success connection established)

- Just open console and run .\link in backend folder and should launch backend, bridge and frontend correctly and they will link automatically and you can play rock paper scissors against the server whose logic is on c++ but your visuals are on a webpage which is= cool.


I am planning on putting  this on docker to test how it works to see if I can just copy the environment and run on a friends computer.

This setup is just practice for learning how to do websocket to tcp so I can do stuff with my esp32
