#include <sys/socket.h>
#include <iostream>
#include <netinet/in.h>
#include <cstdlib>
#include <unistd.h>
#include <fcntl.h>   
#include <cstring>


//threads
#include <thread>

//polling   
#include <poll.h>


using namespace std;

// Helper function to turn on non-blocking mode
void setNonBlocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags != -1) {
        fcntl(fd, F_SETFL, flags | O_NONBLOCK);
    }
}


void receiveHandler(char* sharedbuffer, int incomingSocketFD) {

    while(true){

        pollfd fds[1];

        fds[0].fd = incomingSocketFD;
        fds[0].events = POLLIN;

        char  tempBuffer[1024]{0};

        // 2. Call poll with a 5000 ms timeout
        int ret = poll(fds, sizeof(fds) / sizeof(fds[0]), 5000);

        // 3. Handle the return values
        if (ret == -1) {
            std::cerr << "Poll system call failed." << std::endl;
        } 
        
        if (ret == 0) {
            // Timeout occurred, no events
            continue;
        }

        // 4. Check which descriptor generated the event and handle it accordingly
        if (fds[0].revents & POLLIN) {

            memset(sharedbuffer, 0, 1024);
            ssize_t bytesRead = recv(incomingSocketFD, tempBuffer, sizeof(tempBuffer) - 1, 0);
            if (bytesRead > 0) {
                while (bytesRead > 0 && (tempBuffer[bytesRead - 1] == '\n' || tempBuffer[bytesRead - 1] == '\r')) {
                    tempBuffer[bytesRead - 1] = '\0';
                    bytesRead--;
                }
                std::cout<< "Message from client: " << tempBuffer << std::endl;
                strcpy(sharedbuffer, tempBuffer);
            }

        }
        
    }
}

void sendHandler(std::string message, int incomingSocketFD) {
    send(incomingSocketFD, message.c_str(), message.length(), 0);
    std::cout << "Message sent to client: " << message << std::endl;
}


int main(){

    //Creating socket (non blocking)
    int serverSocket  = socket(AF_INET, SOCK_STREAM, 0);

    //Reuse address option to avoid "Address already in use" error when restarting the server
    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));


    //Creating Address for socket
    sockaddr_in serverAddress;

    serverAddress.sin_family = AF_INET;
    serverAddress.sin_port = htons(9000); // Converts port to network byte order
    serverAddress.sin_addr.s_addr = INADDR_ANY; // Listen on all available interfaces
    
    //Binding Socket to a specific address
    bind(serverSocket, (struct sockaddr*)&serverAddress, sizeof(serverAddress)); //Binding Socket to a specific address

    //Listens on socket addr for any connections
    listen(serverSocket, 1);
    
    std::cout << "Server is listening on port 9000..." << std::endl;

    //For Servers, the socket returned by accept() is used for both sending and receiving data with the connected client.
    int incomingSocketFD = accept(serverSocket, nullptr, nullptr);
    std::cout << "Client connected!" << std::endl;

    setNonBlocking(incomingSocketFD);


    char * sharedBuffer= new char[1024]; // Allocate memory and assign a pointerfor the buffer
    memset(sharedBuffer, 0, 1024);

    std::thread t(receiveHandler, sharedBuffer, incomingSocketFD);

    
    string outcomes[3][3]{
        // Rock, Paper, Scissors outcomes for the client against the server's move
        //top row is server move, left column is client move
        {"Draw", "Lose", "Win"},  // Rock outcomes
        {"Win", "Draw", "Lose"},  // Paper outcomes
        {"Lose", "Win", "Draw"}   // Scissors outcomes
    };

    
    int clientMoveIndex = -1; // Initialize to an invalid index

    while  (strcmp(sharedBuffer, "q") != 0) {

        std::string clientMove;
        int randomNum = rand() % 3; //Generates a random number between 0 and 2

        bool playing = true;
        bool deciding = true;
        while(deciding){
            clientMove = sharedBuffer;

            if (clientMove == "q") {
                std::cout << "Quit command received. Exiting game loop." << std::endl;
                playing = false;
                break;
            }

            if (clientMove == "Rock") {
                clientMoveIndex = 0;
                deciding = false;
            } else if (clientMove == "Paper") {
                clientMoveIndex = 1;
                deciding = false;
            } else if (clientMove == "Scissors") {
                clientMoveIndex = 2;
                deciding = false;
            } else {
                deciding = true;
            }

        }

        if(playing == false){
            break;
        }
        
        std::string serverMoves[3] = {"Rock", "Paper", "Scissors"};
        std::string serverMove = serverMoves[randomNum];      
        std::string outcome = outcomes[randomNum][clientMoveIndex]; // Determine the outcome based on the moves

        sendHandler(outcome + "\n", incomingSocketFD); //Sending message to client
        std::cout << "Server chose: " << serverMove << ", Client chose: " << clientMove << ", Outcome for player: " << outcome << std::endl;
        memset(sharedBuffer, 0, 1024);
        clientMoveIndex = -1;
    }




    // std::string msg = "r";
        // while (msg != "q") {
        //     char buffer[1024] = {0};
        //     recv(incomingSocketFD, buffer, sizeof(buffer), 0);
        //     if (buffer == "q") {
        //         std::cout << "Client requested to quit. Exiting poll loop." << std::endl;
        //         break;
        //     }
        //     int randomNum = rand() % 3; //Generates a random number between 0 and 2
        //     std::string serverMoves[3] = {"Rock", "Paper", "Scissors"};
        //     std::string serverMove = serverMoves[randomNum];      
        //     send(incomingSocketFD, serverMove.c_str(), serverMove.length(), 0); //Sending message to client
        //     std::cout << "Server chose: " << serverMove << std::endl;
        //     std::cout << "Message from client: " << buffer << std::endl;
        // }
        
    // Clean up threads and socket handles
    if (t.joinable()) {
        t.detach();
    }

    delete[] sharedBuffer; // Free the allocated memory for the buffer

    close(serverSocket);
    close(incomingSocketFD);
    std::cout << "Polled socket cleaned up. Exiting server routine." << std::endl;

    return 0;
}
