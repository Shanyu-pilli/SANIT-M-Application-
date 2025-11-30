#!/usr/bin/env bash

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export PATH=${ROOTDIR}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/configtx

: ${CONTAINER_CLI:="docker"}
CONTAINER_CLI_COMPOSE="docker compose"

echo "Using Docker CLI = $CONTAINER_CLI"

# ----------------------------------------------------------
#  Clean existing crypto + containers
# ----------------------------------------------------------
function clearContainers() {
  echo " Removing Fabric-related containers..."
  docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null
  docker rm -f $(docker ps -aq --filter name='dev-peer*') 2>/dev/null
  docker rm -f SANIT-M-DATABASE 2>/dev/null
}

function removeUnwantedImages() {
  echo "Removing dev chaincode images..."
  docker image rm -f $(docker images -aq --filter reference='dev-peer*') 2>/dev/null
}

# ----------------------------------------------------------
#  Generate crypto for 2 departments + orderer
# ----------------------------------------------------------
function createOrgs() {
  echo "Removing previous crypto material..."
  rm -rf organizations/peerOrganizations organizations/ordererOrganizations

  echo "Generating certificates using cryptogen"

  for dept in {1..2}
  do
     echo "----> Generating crypto for dept$dept"
     cryptogen generate --config=./organizations/cryptogen/crypto-config-dept$dept.yaml --output="organizations"
  done

  echo "----> Generating crypto for Orderer Org"
  cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"

  echo "All organizations generated"
}

# ----------------------------------------------------------
#  Bring up network: Orderer + 8 peers
# ----------------------------------------------------------
function networkUp() {
  if [ ! -d "organizations/peerOrganizations" ]; then
      createOrgs
  fi

  echo "Starting Docker network for 2 departments..."
  docker compose -f compose/docker-compose-network.yml up -d

  if [ $? -ne 0 ]; then
    echo "Failed to start network."
    exit 1
  fi

  docker ps
}

# ----------------------------------------------------------
#  Create channel + join all peers
# ----------------------------------------------------------
# function createChannel() {

#   CHANNEL_NAME="universitychannel"

#   echo "Generating channel transaction..."
#   configtxgen -profile ChannelUsingRaft \
#       -outputCreateChannelTx ./channel-artifacts/channel.tx \
#       -channelID $CHANNEL_NAME

#   echo "Creating channel..."
#   docker exec cli peer channel create \
#      -o orderer.example.com:7050 \
#      -c $CHANNEL_NAME \
#      -f /etc/hyperledger/configtx/channel.tx \
#      --outputBlock /etc/hyperledger/configtx/${CHANNEL_NAME}.block

#   echo "Joining Dept1 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept1MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/organizations/dept1.example.com/users/Admin@dept1.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
#      cli peer channel join -b /etc/hyperledger/configtx/${CHANNEL_NAME}.block

#   echo "Joining Dept2 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept2MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/organizations/dept2.example.com/users/Admin@dept2.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
#      cli peer channel join -b /etc/hyperledger/configtx/${CHANNEL_NAME}.block

#   echo "Channel created and both peers joined!"
# }

# function createChannel() {
#   CHANNEL_NAME="universitychannel"
  
#   # Create channel-artifacts directory
#   mkdir -p channel-artifacts

#   echo "Generating channel transaction..."
#   configtxgen -profile ChannelUsingRaft \
#       -outputCreateChannelTx ./channel-artifacts/channel.tx \
#       -channelID $CHANNEL_NAME

#   if [ $? -ne 0 ]; then
#     echo "Failed to generate channel transaction"
#     exit 1
#   fi

#   echo "Creating channel..."
#   docker exec cli peer channel create \
#      -o orderer.example.com:7050 \
#      -c $CHANNEL_NAME \
#      -f /etc/hyperledger/configtx/channel.tx \
#      --outputBlock /etc/hyperledger/configtx/${CHANNEL_NAME}.block \
#      --tls true \
#      --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#   echo "Joining Dept1 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept1MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept1.example.com/users/Admin@dept1.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
#      cli peer channel join -b /etc/hyperledger/configtx/${CHANNEL_NAME}.block

#   echo "Joining Dept2 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept2MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept2.example.com/users/Admin@dept2.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
#      cli peer channel join -b /etc/hyperledger/configtx/${CHANNEL_NAME}.block

#   echo "Channel created and both peers joined!"
# }

# function createChannel() {
#   CHANNEL_NAME="universitychannel"
  
#   # Create channel-artifacts directory
#   mkdir -p channel-artifacts

#   echo "Generating channel transaction..."
#   configtxgen -profile ChannelUsingRaft \
#       -outputCreateChannelTx ./channel-artifacts/channel.tx \
#       -channelID $CHANNEL_NAME

#   if [ $? -ne 0 ]; then
#     echo "Failed to generate channel transaction"
#     exit 1
#   fi

#   echo "Creating channel..."
#   docker exec cli peer channel create \
#      -o orderer.example.com:7050 \
#      -c $CHANNEL_NAME \
#      -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx \
#      --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
#      --tls true \
#      --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#   echo "Joining Dept1 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept1MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept1.example.com/users/Admin@dept1.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
#      cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

#   echo "Joining Dept2 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept2MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept2.example.com/users/Admin@dept2.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
#      cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

#   echo "Channel created and both peers joined!"
# # }
# function createChannel() {
#   CHANNEL_NAME="universitychannel"
  
#   # Create channel-artifacts directory on host
#   mkdir -p channel-artifacts

#   echo "Generating channel transaction..."
#   configtxgen -profile ChannelUsingRaft \
#       -outputCreateChannelTx ./channel-artifacts/channel.tx \
#       -channelID $CHANNEL_NAME

#   if [ $? -ne 0 ]; then
#     echo "Failed to generate channel transaction"
#     exit 1
#   fi

#   # Verify the file was created
#   if [ ! -f "./channel-artifacts/channel.tx" ]; then
#     echo "Channel transaction file not found!"
#     exit 1
#   fi

#   # Restart CLI container to ensure volume mounts are fresh
#   echo "Restarting CLI container..."
#   docker compose -f compose/docker-compose-network.yml restart cli
#   sleep 5

#   # Verify the file is accessible in the container
#   echo "Verifying file accessibility in container..."
#   docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/

#   echo "Creating channel..."
#   # docker exec cli peer channel create \
#   #    -o orderer.example.com:7050 \
#   #    -c $CHANNEL_NAME \
#   #    -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx \
#   #    --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
#   #    --tls true \
#   #    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#   # if [ $? -ne 0 ]; then
#   #   echo "Failed to create channel"
#   #   exit 1
#   # fi
#   echo "Creating channel transaction inside CLI container..."
#   docker exec -e FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/configtx cli configtxgen \
#     -profile ChannelUsingRaft \
#     -outputCreateChannelTx /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx \
#     -channelID $CHANNEL_NAME

#   if [ $? -ne 0 ]; then
#     echo "Failed to generate channel transaction"
#     exit 1
#   fi

#   echo "Creating channel..."
#   docker exec cli peer channel create \
#      -o orderer.example.com:7050 \
#      -c $CHANNEL_NAME \
#      -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx \
#      --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
#      --tls true \
#      --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#   echo "Joining Dept1 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept1MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept1.example.com/users/Admin@dept1.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
#      cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

#   echo "Joining Dept2 peer..."
#   docker exec \
#      -e CORE_PEER_LOCALMSPID=Dept2MSP \
#      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept2.example.com/users/Admin@dept2.example.com/msp \
#      -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
#      cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

#   echo "Channel created and both peers joined!"
# }


# Add this function to your network.sh file

function createChannel() {
  CHANNEL_NAME="universitychannel"
  
  # Create channel-artifacts directory if it doesn't exist
  mkdir -p channel-artifacts

  echo "Generating channel transaction..."
  export FABRIC_CFG_PATH=${PWD}/configtx
  configtxgen -profile ChannelUsingRaft \
      -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx \
      -channelID $CHANNEL_NAME

  if [ $? -ne 0 ]; then
    echo "Failed to generate channel transaction"
    exit 1
  fi

  # Restart CLI container to ensure fresh mounts
  echo "Restarting CLI container..."
  docker compose -f compose/docker-compose-network.yml restart cli
  sleep 5

  echo "Creating channel..."
  docker exec cli peer channel create \
     -o orderer.example.com:7050 \
     -c $CHANNEL_NAME \
     -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx \
     --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
     --tls true \
     --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  if [ $? -ne 0 ]; then
    echo "Failed to create channel"
    exit 1
  fi

  echo "Joining Dept1 peer..."
  docker exec \
     -e CORE_PEER_LOCALMSPID=Dept1MSP \
     -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept1.example.com/users/Admin@dept1.example.com/msp \
     -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
     cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

  if [ $? -ne 0 ]; then
    echo "Failed to join Dept1 peer to channel"
    exit 1
  fi

  echo "Joining Dept2 peer..."
  docker exec \
     -e CORE_PEER_LOCALMSPID=Dept2MSP \
     -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept2.example.com/users/Admin@dept2.example.com/msp \
     -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
     cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

  if [ $? -ne 0 ]; then
    echo "Failed to join Dept2 peer to channel"
    exit 1
  fi

  echo "✅ Channel '${CHANNEL_NAME}' created and both peers joined successfully!"
  
  # Verify the channel
  echo "Verifying channel on Dept1 peer..."
  docker exec \
     -e CORE_PEER_LOCALMSPID=Dept1MSP \
     -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept1.example.com/users/Admin@dept1.example.com/msp \
     -e CORE_PEER_ADDRESS=peer0.dept1.example.com:7051 \
     cli peer channel list

  echo "Verifying channel on Dept2 peer..."
  docker exec \
     -e CORE_PEER_LOCALMSPID=Dept2MSP \
     -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dept2.example.com/users/Admin@dept2.example.com/msp \
     -e CORE_PEER_ADDRESS=peer0.dept2.example.com:9051 \
     cli peer channel list
}
# ----------------------------------------------------------
#  Deploy Chaincode
# ----------------------------------------------------------
function deployCC() {
  CC_NAME="feedbackcc"
  CC_VERSION=1.0
  CC_SRC_PATH="../chaincode/feedback"

#   echo "Packaging chaincode..."
#   peer lifecycle chaincode package feedback.tar.gz \
#      --path $CC_SRC_PATH --lang golang --label feedback_1

#   echo "Installing chaincode on all peers..."
#   for dept in {1..2}
#   do
#     docker exec cli peer lifecycle chaincode install feedback.tar.gz \
#         --peerAddresses peer0.dept$dept.example.com:7051
#   done


  echo "deployment not yet implemented"
}

# ----------------------------------------------------------
#  Bring down network
# ----------------------------------------------------------
function networkDown() {
  docker compose -f compose/compose-network.yaml down --volumes --remove-orphans
  clearContainers
  removeUnwantedImages
  echo "Network shut down"
}

# ----------------------------------------------------------
#  CLI main
# ----------------------------------------------------------
if [ "$1" = "up" ]; then
   networkUp
elif [ "$1" = "down" ]; then
   networkDown
elif [ "$1" = "createChannel" ]; then
   createChannel
elif [ "$1" = "deployCC" ]; then
   deployCC
else
   echo "Usage: ./network.sh up | down | createChannel | deployCC"
fi
