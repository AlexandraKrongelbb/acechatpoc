import React from 'react';
import {
  Platform,
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  ListView,
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

import {GiftedChat, Time, InputToolbar, Composer, Send, MessageText, utils, MessageContainer, Day, GiftedAvatar, Actions, Bubble, Message, Avatar, SystemMessage} from 'react-native-gifted-chat';
import CustomActions from '../CustomActions';
import CustomView from '../CustomView';
import config from '../config';
import './userAgent';
import { AuthWebView } from '@livechat/chat.io-customer-auth';
import { init } from '@livechat/chat.io-customer-sdk';
import Bubbles from '../Bubbles';
import Rx from 'rxjs'
import moment from 'moment';
import { isWithinMinutes } from '../utils/isWithinMinutes';
import { Common } from '../styles';
import LinearGradient from 'react-native-linear-gradient';

let { isSameDay, isSameUser, warnDeprecated } = utils;

const { width, height } = Dimensions.get('window');

const images = {
  avatar: require('../img/AceAvatar.png'),
  send: require('../img/send.png'),
  thumbs: require('../img/thumbs.png'),
  thumbsUp: require('../img/thumbsUp.png'),
  thumbsDown: require('../img/thumbsDown.png')
};

class CustomGiftedChat extends GiftedChat {  
  renderMessages() {
    const AnimatedView = this.props.isAnimated === true ? Animated.View : View;
    return (
      <AnimatedView style={{
        height: this.state.messagesContainerHeight,
      }}>
        <CustomMessageContainer
          {...this.props}

          invertibleScrollViewProps={this.invertibleScrollViewProps}

          messages={this.getMessages()}

          ref={component => this._messageContainerRef = component}
        />
        {this.renderChatFooter()}
      </AnimatedView>
    );
  } 
}

class CustomeSystemMessage extends SystemMessage {
  render() {
    const { currentMessage } = this.props;
    if (currentMessage.rating) {
      return (
        <View style={[systemStyles.container, this.props.containerStyle]}>
          <View style={[systemStyles.wrapper, this.props.wrapperStyle,{
            flexDirection: 'column',
            justifyContent: 'center'
          }]}>
            <Image style={{width:65,height:58,marginBottom: 12}} source={images.send} />
            <Text style={[systemStyles.text, this.props.textStyle,{ 
              fontFamily: 'HelveticaNeueLTStd-Cn',
              fontSize: 14,
              color: '#5b5b5b'
            }]}>
              {currentMessage.text}
            </Text>
            <Text style={[systemStyles.text, this.props.textStyle,{ 
              fontFamily: 'HelveticaNeueLTStd-CnO',
              fontSize: 14,
              color: '#5b5b5b'
            }]}>
              {currentMessage.rating.comment}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[systemStyles.container, this.props.containerStyle]}>
        <View style={[systemStyles.wrapper, this.props.wrapperStyle]}>
          <Text style={[systemStyles.text, this.props.textStyle]}>
            {currentMessage.text}
          </Text>
        </View>
      </View>
    );
  }
}

const systemStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: 5,
    marginBottom: 10,
  },
  text: {
    backgroundColor: "transparent",
    color: "#b2b2b2",
    fontSize: 12,
    fontWeight: "300"
  }
});

class CustomMessageContainer extends MessageContainer {
  constructor(props) {
    super(props);

    this.renderRow = this.renderRow.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.renderLoadEarlier = this.renderLoadEarlier.bind(this);
    this.renderScrollComponent = this.renderScrollComponent.bind(this);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => {
       // return r1.hash !== r2.hash;
        return true;
      }
    });

    const messagesData = this.prepareMessages(props.messages);
    this.state = {
      dataSource: dataSource.cloneWithRows(messagesData.blob, messagesData.keys)
    };
  }

}
  
class CustomMessage extends Message {
  renderAvatar() {
    return (
      <Avatar {...this.getInnerComponentProps()}         
        imageStyleTest={{
          right: {
            backgroundColor: '#aaa'
          }   
        }}
        />
    );
  } 
}

// /////////////////////////////////
// ///// CUSTOM DAY COMPONENT //////
// /////////////////////////////////
// /////////////////////////////////
const dayStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  wrapper: {
    // backgroundColor: '#ccc',
    // borderRadius: 10,
    // paddingLeft: 10,
    // paddingRight: 10,
    // paddingTop: 5,
    // paddingBottom: 5,
  },
  text: {
    backgroundColor: 'transparent',
    color: '#5b5b5b',
    fontSize: 12,
    fontFamily: 'HelveticaNeue-CondensedBold',
  },
});

class CustomDay extends Day {
  render() {
    const { timeFormat } = this.props;

    if (isWithinMinutes(this.props.currentMessage, this.props.previousMessage,5)) {
      return (
        <View style={[dayStyles.container, this.props.containerStyle]}>
          <View style={[dayStyles.wrapper, this.props.wrapperStyle]}>
            <Text style={[dayStyles.text, this.props.textStyle]}>
              {moment(this.props.currentMessage.createdAt).locale(this.context.getLocale()).format('ddd LT').toUpperCase()}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  }
}
class CustomBubble extends Bubble {
  renderTicks() {
    const {currentMessage, adminLastSeen, myLastMessage} = this.props;

    if (currentMessage.user._id !== this.props.user._id) {
        return;
    }
    if (adminLastSeen >= currentMessage.createdAt) {
      if (currentMessage.createdAt >= adminLastSeen) {
        return (
          <View>
            <Text>Seen</Text>
          </View>
        )
      } else {
        return;
      }

    }
    if (currentMessage.createdAt >= myLastMessage) {
      return (
        <View>
          <Text style={{
            fontFamily: 'HelveticaNeueLTStd-MdCn',
            fontSize: 11,
            marginTop: 4,
            marginBottom: -7,
            color: '#5b5b5b'
          }}>Delivered</Text>
        </View>
      )
    }
  
    return;


    // if (currentMessage.sent || currentMessage.received) {
    //   return (
    //     <View style={styles.tickView}>
    //       {currentMessage.sent && <Text style={[styles.tick, this.props.tickStyle]}>✓</Text>}
    //       {currentMessage.received && <Text style={[styles.tick, this.props.tickStyle]}>✓</Text>}
    //     </View>
    //   )
    // }
  }
  render() {
    return (
      <View>        
        <View style={[bubbleStyles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
          <View style={[bubbleStyles[this.props.position].wrapper, this.props.wrapperStyle[this.props.position]]}>
            <TouchableWithoutFeedback
              onLongPress={this.onLongPress}
              accessibilityTraits="text"
              {...this.props.touchableProps}
            >
              <View>
                {this.renderCustomView()}
                {this.renderMessageImage()}
                {this.renderMessageText()}
                <View style={[bubbleStyles.bottom, this.props.bottomContainerStyle[this.props.position]]}>
                  
                  
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
          {this.renderTicks()}
        </View>        
      </View>

    );
  }
}

const styles = {
  left: StyleSheet.create({
    container: {
      marginRight: 8
    },
    onTop: {
      alignSelf: "flex-start"
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
  right: StyleSheet.create({
    container: {
      marginLeft: 8,
    },
    onTop: {
      alignSelf: "flex-start"
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
};

export default class ChatIO extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      users: [],
      userData: [],
      customerId: this.props.customerId || null,
      chatId: this.props.chatId || null,
      isActive: this.props.isActive || false,
      loadEarlier: false,
      isLoading: true,
      typingText: null,
      isLoadingEarlier: false,
      connected: false,
      PING: null,
      username: null,
      myLastMessage: null,
      adminLastSeen: null,
      minInputToolbarHeight: 64
    };
    this.sdk = this.props.sdk;
   // this.socket = new WebSocket('wss://api.chat.io/customer/v0.2/rtm/ws?license_id='+config.chatio_license);
   
    this._isMounted = false;
    this.onSend = this.onSend.bind(this);
    this.onReceive = this.onReceive.bind(this);
    this.renderCustomActions = this.renderCustomActions.bind(this);
    this.renderBubble = this.renderBubble.bind(this);
  //  this.renderMessage = this.renderMessage.bind(this);
    this.renderSystemMessage = this.renderSystemMessage.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    //this.renderChatFooter = this.renderChatFooter.bind(this);
    this.onLoadEarlier = this.onLoadEarlier.bind(this);

    this._isAlright = null  ;
    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  onNavigatorEvent(event) { 
    console.log(event)
    if (event.type == 'NavBarButtonPress') {
      if (event.id == 'back') { 
        this.props.navigator.pop({
          passProps: {
            reload: true
          }
        });
      }
      if (event.id == 'end') { 
        this.endChat(this.state.chatId);
      }
      if (event.id == 'close') { 
        this.props.navigator.dismissModal();
      }
    }
  }
  componentWillMount() {
    this.props.navigator.setStyle({
      navBarCustomView: 'Header',
      navBarCustomViewInitialProps: {
        title: this.props.title,
        subtitle: this.props.subtitle
      }
    });
  }

  endChat = (id) => {
    console.log('this.state.isActive: '+this.state.isActive)
    if (this.state.isActive) {
      console.log(id)
      this.sdk.closeThread(id).then(response => {
        console.log('closed')
        console.log(response)
        this.setState({
          messages: [{
            _id: Math.round(Math.random() * 1000000),
            text: 'You have ended the chat',
            createdAt: Date.now(),
            system: true
          }, ...this.state.messages]
        });
        setTimeout(() => {
          this.setState({
            isActive: false
          });
          setTimeout(() => {
            this.props.navigator.showLightBox({
              screen: "ThumbsModal", // unique ID registered with Navigation.registerScreen
              passProps: {
                  
              }, // simple serializable object that will pass as props to the lightbox (optional)
              style: {
                backgroundBlur: "none", // 'dark' / 'light' / 'xlight' / 'none' - the type of blur on the background
                backgroundColor: "rgba(0,0,0,.5)", // tint color for the background, you can specify alpha here (optional)
                tapBackgroundToDismiss: true // dismisses LightBox on background taps (optional)
              }
            });
          },600)

        }, 200);
  
      })
      .catch(error => {
        console.log(error)
      });
    }
  }
  
  // static navigatorStyle = {
  //   navBarCustomView: 'Header',
  //   navBarCustomViewInitialProps: {
  //     title: 'this.props.title',
  //     subtitle: 'this.props.subtitle'
  //   }
  // };

  onMessage = (d) => {
    let msg = JSON.parse(d.data);
    
    //handle unsuccesed messages
    if (msg.success == false) {
      console.error(msg.payload.error)
      return 
    }

    if (msg.action !== 'ping') {
      console.log(msg);
    }
    
    switch (msg.action) {
      case "login": 
        return this.onMessageLogin(msg);
        break;

      case "start_chat":
        return this.onMessageStartChat(msg);
        break;

      case "incoming_event":
        return this.onIncomingEvent(msg);
        break;

      case "incoming_chat_thread":
        return this.onIncomingChatThread(msg);
        break;

      case "chat_users_updated": 
        return this.onChatUsersUpdated(msg);
        break;

      // case "incoming_typing_indicator":
      //   return this.handleTypingIndicator(msg);
      //   break;
    }
  }; 

  apiSendStartChat = () => {
    
    if (!(this.props.name && this.props.email && this.props.description)) {
      return false;
    }
    console.log('starting chat')
    this.sdk.startChat()
      .then(chat => {
        this.setState({
          chatId: chat.id
        });

        // TODO replace with new api
        // temporary for storing chat titles
        // ////////////////////////////////
        // ////////////////////////////////
        // eventually replace with new configuration API
        // ////////////////////////////////
        let payload = { fields: {} }
        let chatKey = 'chat_'+chat.id;
        let catkey = 'category_'+chat.id;
        payload.fields[catkey] = this.props.area;   
     //   let chatKeyLastVisit = 'lastVisit_'+chat.id;
        payload.fields[chatKey] = this.props.description;
     //   payload.fields[chatKeyLastVisit] = Date.now().toString();
        // ////////////////////////////////
        // ////////////////////////////////
        // ////////////////////////////////

        this.sdk.updateCustomer(payload);

        this.sdk.sendEvent(chat.id, {
          type: 'filled_form',
          fields: [{
              "type": "text",
              "name": "name",
              "label": "Your name:",
              "required": true,
              "value": this.props.name
            },
            {
              "type": "email",
              "name": "email",
              "label": "E-mail:",
              "required": true,
              "value": this.props.email
            }]
        });
        this.apiSendChatMessage(chat.id,this.props.description,true).then(response => {
          console.log(response)
        });

      })
      .catch(error => {
        console.log(error);
      })

    
  }
  onMessageStartChat = (msg) => {  
    console.log('set chat id')
    this.setState({
      chatId: msg.payload.chat.id
    })
  }
  apiSendChatMessage = (chatId,msg,isDescription) => {
    let payload = {
      text: msg
    }
   // if (isDescription) payload.customId = 'description';
   // console.log(payload);
    this.sdk.sendMessage(chatId,payload).then(message => {
      console.log(message);
      if (this._isMounted && (chatId === this.state.chatId)) {
        this.sdk.updateLastSeenTimestamp(chatId,message.timestamp).then(response => {
          console.log(response)
        })
        this.setState({
          myLastMessage: message.timestamp,
          messages: [{
            text: msg,
            _id: message.id,
            createdAt: message.timestamp,
            sent: true,
            user: {
              _id: message.author,
              name: this.props.name || this.state.username
            }
          }, ...this.state.messages]
        });
    //  this.doSomething();
      }
    }).catch(error => {
      console.log(error);
    });
  }

  // emit message via websocket
  sendMessage = (name,payload) => {
    let protocolMessage = {
        action: name,
        id: this.generateID(), // id for match response
    }

    if (payload) {
        protocolMessage.payload = payload
    }
  
    this.socket.send(JSON.stringify(protocolMessage));
  }

  apiSendLogin = () => {
    this.sendMessage("login", {
      customer: {
        name: this.props.name,
        email: this.props.email
      }
    });  
  }
  
  generateID = () => {
    return Math.random().toString(36)
  }

  componentDidMount() {
    this._isMounted = true;
  //  this.sdk = init({ license: config.chatio_license });

    if (this.sdk && this._isMounted) {
      if (this.props.chatId) {
        // previous chat
        this.setState({
          chatId: this.props.chatId,
          userData: this.props.userData
        })
        // UPDATE USER OBJECT with last time youve viewed chat
         let payload = { fields: {} }
        //  let catkey = 'category_'+this.props.chatId;
        //  payload.fields[catkey] = 'Hardware';        
         this.sdk.updateCustomer(payload);

        this.sdk.updateLastSeenTimestamp(this.props.chatId,Date.now());
        this.getChatHistory(this.props.chatId);
      } else {
        // new chat
        this.setState({
          isActive: true
        })
        let payload = {
          name: this.props.name,
          email: this.props.email
        }
        this.setCustomerInfo(payload);
        this.apiSendStartChat(); 
        this.setState({
          isLoading: false
        })
      }
 
    }
    this.sdk.on('connected', ({ chatsSummary, totalChats }) => {
      console.log('on connected', { chatsSummary, totalChats })
      if (!this.props.name || !this.props.email) {
        console.log('===========--------- NOT SURE HOW WE GOT HERE ----------=================')
        return false;
      }
      this.setCustomerInfo({
        name: this.props.name,
        email: this.props.email
      });
      this.apiSendStartChat();  
    })

    // Rx.Observable.from(this.sdk)
    // .subscribe(([ eventName, eventData ]) => {
    //     console.log('RX.OBSERVABLE')
    //     console.log(eventName, eventData)
    // })

    this.sdk.on('connection_lost', () => {
      console.log('connection_lost')
    })
    this.sdk.on('disconnected', reason => {
      console.log('disconnected')
      console.log(reason)
    })
    this.sdk.on('connection_restored', payload => {
      console.log('connection_restored')
      console.log(payload.chatsSummary)
      console.log(payload.totalChats)
    })
    this.sdk.on('customer_id', id => {
      console.log('customer id is', id)
      if (this._isMounted) {
        this.setState({
          customerId: id
        })
      }

    })
    this.sdk.on('last_seen_timestamp_updated', payload => {
      console.log('last_seen_timestamp_updated')
      console.log(payload.chat)
      console.log(payload.user)
      console.log(payload.timestamp)
      if (this._isMounted) {

      }
    })
    this.sdk.on('new_event', (payload) => {
      console.log('new_event')
      if (this._isMounted) {
        this.onIncomingEvent(payload);
      }      
    })
    this.sdk.on('user_data', (user) => {
      console.log('user_data');
      if (this._isMounted) {
        this.addGlobalUsers(user);
      }
  //    this.onChatUsersUpdated(user);
    })
    this.sdk.on('user_is_typing', (payload) => {
      this.handleTypingIndicator(payload,true);
    })
    this.sdk.on('user_stopped_typing', (payload) => {
      this.handleTypingIndicator(payload,false);
    })
    this.sdk.on('user_joined_chat', ({ user, chat }) => {
      if (this._isMounted) {
        this.userChatStatusUpdate(user,chat,true);
      }      
    })
    this.sdk.on('user_left_chat', ({ user, chat }) => {      
      if (this._isMounted) {
        this.userChatStatusUpdate(user,chat,false);
      }
    })
    this.sdk.on('thread_closed', ({ chat }) => {
      console.log('thread_closed')
      console.log(chat)
      if (this._isMounted) {
        this.closeChat(chat);
      }
    })
    this.sdk.on('thread_summary', (thread_summary) => {
      console.log('thread_summary')
      console.log(thread_summary)
    })
  }

  // function compare(a,b) {
  //   if (a.last_nom < b.last_nom)
  //     return -1;
  //   if (a.last_nom > b.last_nom)
  //     return 1;
  //   return 0;
  // }
  
  // objs.sort(compare);
  userChatStatusUpdate = (user,chat,didJoin) => {
    console.log(user,chat)
    let userData = this.state.userData.slice();
    console.log(userData)
    let name = 'Agent';
    for (i=0; i<userData.length; i++) {
      if (userData[i].id === user) {
        name = userData[i].name;
      }
    }
    let msg = name + ' has ' + (didJoin ? 'joined' : 'left') + ' the chat';
    this.setState({
      messages: [{
        _id: Math.round(Math.random() * 1000000),
        text: msg,
        createdAt: Date.now(),
        system: true
      }, ...this.state.messages]
    });
  }
  closeChat = (chat) => {
    this.setState({
      messages: [{
        _id: Math.round(Math.random() * 1000000),
        text: 'This chat has been closed',
        createdAt: Date.now(),
        system: true
      }, ...this.state.messages]
    });
  }
  getChatHistory = (id) => {
    const history = this.sdk.getChatHistory(id);
    
    let userData = this.props.userData.slice();
    let users = [];
    for (i=0; i<userData.length; i++) {
      if (userData[i].type === 'customer') {
        users.push(userData[i]);
      }
    }
    let lastUserIdx = users.length-1;
    // users.sort(function(a, b) {
    //   return b.lastSeenTimestamp - a.lastSeenTimestamp
    // });   
    let lastMessage = null;
    let username = users[lastUserIdx].name || 'Customer';
    let chatDisplayName = username;
    let avatar = null;
    this.setState({
      username: username
    });    
    
    
    history.next().then(result => {
      const events = result.value
      console.log(events)
      for (i=0; i<events.length; i++) {
        if (events[i].type === 'message' && events[i].text) {
          username = users[lastUserIdx].name || 'Customer';
          avatar = null;
          if (events[i].author === this.state.customerId) {
            chatDisplayName = username;
            if (!lastMessage || (events[i].timestamp > lastMessage)) {
              lastMessage = events[i].timestamp;
            }
          } else {
            chatDisplayName = 'Ace';
            avatar = images.avatar
          }
          this.setState({
            messages: [{
              text: events[i].text,
              _id: events[i].id,
              createdAt: events[i].timestamp,
              user: {
                _id: events[i].author,
                name: chatDisplayName,
                avatar: avatar
              }
            }, ...this.state.messages]
          });
        }
      }
      console.log('---------------====================-------------')
      console.log(lastMessage)
      this.setState({
        myLastMessage: lastMessage
      })
      if (result.done) {
        
        this.setState({
          isLoading: false
        });
      }

    })
  }

  setCustomerInfo = (userData) => {
    console.log('setCustomerInfo');
    this.sdk.updateCustomer({
      name: userData.name,
      email: userData.email
    })
    .then(response => {
      console.log(response)
    })
    .catch(error => {
      console.log(error);
    })

  }
  // componentWillMount() {
    
  //   this.setState(() => {
  //     return {
  //       messages: require('../data/messages.js'),
  //     };
  //   });
  // }

  componentWillUnmount() {
    this._isMounted = false;
  //  clearInterval(this._PING);
    // disconnect websocket
  }

  onLoadEarlier() {
    this.setState((previousState) => {
      return {
        isLoadingEarlier: true,
      };
    });

    setTimeout(() => {
      if (this._isMounted === true) {
        this.setState((previousState) => {
          return {
            messages: GiftedChat.prepend(previousState.messages, require('../data/old_messages.js')),
            loadEarlier: false,
            isLoadingEarlier: false,
          };
        });
      }
    }, 1000); // simulating network
  }

  handleTypingIndicator = (payload,isTyping) => {
    if (this._isMounted && (payload.chat === this.state.chatId)) {  
      this.setState({
        typingText: isTyping ? 'Agent is typing...' : null,
      })
    }
  }

  onIncomingEvent = (payload) => {
    let event    = payload.event;
    let avatar   = null;
    let username = this.props.name;
    console.log(payload);
    switch (event.type) {
      case 'message':          
        // if its the agent message, remove typing indicator
        if (event.author_id != this.state.customerId) {
          username = 'Ace';
          avatar = images.avatar
          this.setState({
            typingText: false
          })
        }
        if (this._isMounted && (payload.chat === this.state.chatId)) {

        // // UPDATE USER OBJECT with last time youve viewed chat
        // let customerPayload = { fields: {} }
        // let chatKeyLastVisit = 'lastVisit_'+this.state.chatId;
        // customerPayload.fields[chatKeyLastVisit] = Date.now().toString();
        // this.sdk.updateCustomer(customerPayload);

          this.sdk.updateLastSeenTimestamp(this.state.chatId,Date.now());
          this.setState({
            messages: [{
              text: event.text,
              _id: event.id,
              createdAt: event.timestamp,
              user: {
                _id: event.author,
                name: username,
                avatar: avatar
              }
            }, ...this.state.messages]
          });
        }
        break
      default:
        break
      }
    

  }

  onIncomingChatThread = (msg) => {
    let chat = msg.payload.chat;
    console.log(chat)

    // wrong chat id
    if (this.state.chatId && chat.id != this.state.chatId) {
      return;
    }
    if (this._isMounted) {
      chat.thread.events.forEach((event,idx) => {
        if (event.type === 'message') {
          this.setState({
            messages: [{
              text: event.text,
              _id: event.id,
              createdAt: event.timestamp * 1000,
              user: {
                _id: event.author_id,
                name: this.props.name
              }
            }, ...this.state.messages]
          });
        }
      });
      this.setState({
        users: chat.users
      });

    }
  }
  addGlobalUsers = (user) => {
    if (this._isMounted) {
      this.setState({
        userData: [user, ...this.state.userData]
      });
    }
  }
  onChatUsersUpdated = (payload) => {
    console.log(payload);

    if (this._isMounted && payload.type === 'agent') {
    // TODO:  if (this._isMounted && (payload.chat === this.state.chatId)) {
      if (payload.present) {
        // users.added.forEach(function(usr,idx) {
        //   if (idx > 0) addedUsers += ', ';
        //   addedUsers += usr.name;
        // })
        this.setState({
          users: [payload, ...this.state.users]
        })
        this.setState({
          messages: [{
            _id: Math.round(Math.random() * 1000000),
            text: payload.name + ' has joined the chat',
            createdAt: Date.now(),
            system: true
          }, ...this.state.messages]
        });
      }
      else {
        var stateUsers = this.state.users.slice();
        for (i=0; i<stateUsers.length; i++) {
          if (stateUsers[i].id === payload.id) {
            let name = payload.name;
            stateUsers.splice(i, 1);                      
            this.setState({
              messages: [{
                _id: Math.round(Math.random() * 1000000),
                text: name + ' has left the chat',
                createdAt: Date.now(),
                system: true
              }, ...this.state.messages]
            });
            break; 
          }
        }
      }
    }
  }

  onSend(messages) {
    if (this._isMounted) {
      this.apiSendChatMessage(this.state.chatId,messages[0].text);
    }    
  }
  onImageSend = (images) => {
    if (this._isMounted) {
      console.log(images)
      
      this.setState({
        messages: [{
          image: images[0].image,
          _id: 'asdf3245ergae234asdfhadfs',
          createdAt: Date.now(),
          sent: true,
          user: {
            _id: this.state.customerId,
            name: this.props.name || this.state.username
          }
        }, ...this.state.messages]
      });
    }
  }

  renderDay = (props) => {
    return (
      <CustomDay
        {...props}
      />
    );
  }
  renderMessageText = (props) => {
    return (
      <MessageText
        {...props}
        textStyle={{
          left: {
            marginTop: 12,
            marginBottom: 8,
            marginLeft: 12,
            marginRight: 12,
            fontSize: 15,
            lineHeight: 16,
            fontFamily: 'HelveticaNeueLTStd-Cn',
          },
          right: {
            marginTop: 12,
            marginBottom: 8,
            marginLeft: 12,
            marginRight: 12,
            lineHeight: 16,
            fontSize: 15,
            fontFamily: 'HelveticaNeueLTStd-Cn',
          }
        }}
      />
    );
  }

  answerDemo(messages) {
    if (messages.length > 0) {
      if ((messages[0].image || messages[0].location) || !this._isAlright) {
        this.setState((previousState) => {
          return {
            typingText: 'React Native is typing'
          };
        });
      }
    }

    setTimeout(() => {
      if (this._isMounted === true) {
        if (messages.length > 0) {
          if (messages[0].image) {
            this.onReceive('Nice picture!');
          } else if (messages[0].location) {
            this.onReceive('My favorite place');
          } else {
            if (!this._isAlright) {
              this._isAlright = true;
              this.onReceive('Alright');
            }
          }
        }
      }

      this.setState((previousState) => {
        return {
          typingText: null,
        };
      });
    }, 1000);
  }

  onReceive(text) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: text,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            // avatar: 'https://facebook.github.io/react/img/logo_og.png',
          },
        }),
      };
    });
  }

  renderCustomActions(props) {
    if (Platform.OS === 'ios') {
      return (
        <CustomActions
          {...props}
        />
      );
    }
    const options = {
      'Action 1': (props) => {
        alert('option 1');
      },
      'Action 2': (props) => {
        alert('option 2');
      },
      'Cancel': () => {},
    };
    return (
      <Actions
        {...props}
        options={options}
      />
    );
  }



  // renderTime = (props) => {
  //   return (
  //     <Time
  //       {...props}
  //       containerStyle={{
  //         left: {
  //           alignItems: 'center',
  //         },
  //         right: {
  //           alignItems: 'center',
  //         }
  //       }}
  //       textStyle={{
  //         left: {
  //           color: '#5b5b5b',
  //           fontSize: 12,
  //           fontFamily: 'HelveticaNeue-CondensedBold',
  //         },
  //         right: {
  //           color: '#5b5b5b',
  //           fontSize: 12,
  //           fontFamily: 'HelveticaNeue-CondensedBold',
  //         }
  //       }}
  //     />
  //   );
  // }

  onReopenChat = () => {
    this.setState({
      isActive: true
    })
  }
  renderInputToolbar = (props) => {
    if (!this.state.isActive) {
      return (
        <View style={{
           padding:10,
           paddingTop:12,
           marginTop:10,
           backgroundColor:'#fff',
           height:80
         }}
        >
            <Text style={[Common.fontRegular,{marginBottom:3,textAlign:'center'}]}>Reopen Chat?</Text>
            <View style={{
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'center',
              flex:1
            }}>
              <TouchableOpacity
                    style={[commonStyles.button,{marginRight:10}]}
                    onPress={this.onReopenChat}
                  >
                    <LinearGradient colors={['#e21836', '#b11226']} style={[commonStyles.linearGradient]}>
                    <Text style={commonStyles.buttonText}>YES</Text>
                    </LinearGradient>
                  

                  </TouchableOpacity>
                  <TouchableOpacity
                    style={commonStyles.button}
                    onPress={() => { return null; }}
                  >
                    <View style={{flex:1,borderWidth: 1,borderColor:'#c8c8c8',height: 38,justifyContent:'center',alignItems:'center',width:'100%',backgroundColor:'#eee',borderRadius:5}}>
                      <Text style={[commonStyles.buttonText,{color:'#5b5b5b'}]}>NO</Text>
                    </View>
                    
                  

                  </TouchableOpacity>
            </View>
        </View>
      )
    }
    return (
      <InputToolbar
        {...props}
        primaryStyle={{
          padding: 5,
          paddingRight: 12
        }}
      />
    );
  }
  renderSend = (props) => {
    return (
      <Send
        {...props}
      ><Image style={{height: 18,width:20,marginBottom: 15,marginLeft: 14,}} source={images.send} /></Send>
    );
  }
  renderComposer = (props) => {
    return (
      <Composer
        {...props}
        placeholder='Start Typing...'
        placeholderTextColor='#aaaaaa'
        composerHeight={40}
        textInputStyle={{
          fontFamily: 'HelveticaNeueLTStd-Cn',
          fontSize: 15,
          borderWidth: 1,
          borderColor: '#e3e3e3',
          borderRadius: 5,
          lineHeight: 22,
          paddingTop: 12,
          paddingLeft: 10,
          marginTop: Platform.select({
            ios: 5,
            android: 0,
          }),
        }}
      />
    );
  }

  renderBubble(props) {
    return (
      <CustomBubble
        {...props}

        wrapperStyle={{
          left: {
            backgroundColor: '#fff',
          },
          right: {
            backgroundColor: '#e31836',
          }
        }}
      />
    );
  }
  // renderTicks = (props) => {
  //   //const {currentMessage} = this.props;1510868005000
  // //  console.log(props)
    
  //   // Object.getOwnPropertyNames(props.nextMessage).length === 0

  //   if (props.user._id === this.state.customerId) {
  //     if (this.state.adminLastSeen >= props.createdAt) {
  //       if (props.createdAt >= this.state.adminLastSeen) {
  //         return (
  //           <View>
  //             <Text>Seen</Text>
  //           </View>
  //         )
  //       } else {
  //         return;
  //       }

  //     }
  //    // console.log(props.createdAt, this.state.myLastMessage)
  //     if (props.createdAt >= this.state.myLastMessage) {
  //       return (
  //         <View>
  //           <Text style={{
  //             fontFamily: 'HelveticaNeueLTStd-MdCn',
  //             fontSize: 11,
  //             marginTop: 4,
  //             marginBottom: -7,
  //             color: '#5b5b5b'
  //           }}>{props.createdAt} - {this.state.myLastMessage}</Text>
  //         </View>
  //       )
  //     }

  //   }
  //   return;
  // }

  // renderMessage(props) {
  //   return (
  //     <Message
  //       {...props}
  //       wrapperStyle={{
  //         left: {
  //           backgroundColor: '#f0f0f0',
  //         },
  //         right: {
  //           backgroundColor: '#e31836',
  //         }
  //       }}
  //     />
  //   );
  // }

  renderSystemMessage(props) {
    return (
      <SystemMessage
        {...props}
        containerStyle={{
          marginBottom: 15,
        }}
        textStyle={{
          fontSize: 14,
          color: '#5b5b5b',
          fontFamily: 'HelveticaNeueLTStd-MdCn'
        }}
      />
    );
  }

  renderCustomView(props) {
    return (
      <CustomView
        {...props}
      />
    );
  }

  renderFooter(props) {
   if (this.state.typingText) {
      return (
        <View style={chatStyles.footerContainer}>
         <View style={{backgroundColor:'#fff',paddingLeft:7,borderRadius:12,width:60,height:25,justifyContent:'center',alignItems:'center',flex: 1}}>  
           <Bubbles typing={true} size={5} spaceBetween={4} color="#ccc" />
         </View>
          {/* <Text style={chatStyles.footerText}>
            { this.state.typingText  }
          </Text> */}
        </View>
      );
   }
   return null;
  }
  renderAvatar = (props) => {
    return (
      <GiftedAvatar
        textStyle={{
          fontFamily: 'HelveticaNeue-CondensedBold',
          fontSize: 14
        }}
        avatarStyle={StyleSheet.flatten([styles[props.position].image, props.imageStyleTest[props.position]])}
        user={props.currentMessage.user}
        onPress={() => props.onPressAvatar && props.onPressAvatar(props.currentMessage.user)}
      />
    );
  }
  
  renderChatFooter(props) {
      return (
          <View>
              { this.state.connected
                ? <Text>Connected</Text>
                : <Text>Not Connected</Text>  
              }            
          </View>
      )
  }
  getVisitor() { 
    console.log('this.state.customerId: '+this.state.customerId);
    if (this.state.customerId) {
     return {
       _id: this.state.customerId
     } 
    } else {
      return {
       _id: null 
      };
    }
 }

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{backgroundColor:'#eee6d9',justifyContent:'center',alignItems:'center',flex: 1}}>  
          <Bubbles size={8} color="#d80024" />
        </View>
      )
    } else {
      return (
        <View style={{backgroundColor:'#eee6d9',flex: 1}}>          
          <View style={styles.container}>
            <AuthWebView />
          </View>
          <CustomGiftedChat
            messages={this.state.messages}
            onSend={this.onSend}
            loadEarlier={this.state.loadEarlier}
            onLoadEarlier={this.onLoadEarlier}
            isLoadingEarlier={this.state.isLoadingEarlier}
            user={ this.getVisitor() }
            renderMessage={props => <CustomMessage {...props} />}
            renderActions={this.renderCustomActions}
            renderBubble={this.renderBubble}
            renderAvatar={this.renderAvatar}
            renderSystemMessage={this.renderSystemMessage}
            renderCustomView={this.renderCustomView}
            renderFooter={this.renderFooter}
            renderDay={this.renderDay}
            renderMessageText={this.renderMessageText}
            renderTicks={this.renderTicks}
            myLastMessage={this.state.myLastMessage}
            adminLastSeen={this.state.adminLastSeen}
            renderInputToolbar={this.renderInputToolbar}
            renderComposer={this.renderComposer}
            renderSend={this.renderSend}

            onImageSend={this.onImageSend}

            minInputToolbarHeight={this.state.isActive ? 64 : 90}
          />
        </View>
      );
    }
    
  
  }
}
const bubbleStyles = {
  left: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-start',
    },

    wrapper: {
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
      marginRight: 90,
      minHeight: 10,
      justifyContent: 'flex-end',
    },
    containerToNext: {
      borderBottomLeftRadius: 10,
    },
    containerToPrevious: {
      borderTopLeftRadius: 10,
    },
  }),
  right: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-end',
    },
    wrapper: {
      borderRadius: 10,
      backgroundColor: '#0084ff',
      marginLeft: 90,
      minHeight: 30,
      justifyContent: 'flex-end',
    },
    containerToNext: {
      borderBottomRightRadius: 10,
    },
    containerToPrevious: {
      borderTopRightRadius: 10,
    },
  }),
  bottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tick: {
    fontSize: 10,
    backgroundColor: 'transparent',
    color: 'white',
  },
  tickView: {
    flexDirection: 'row',
    marginRight: 10,
  }
};

const commonStyles = StyleSheet.create({
  linearGradient: {
    borderRadius: 5,
    borderWidth: 0,
    height: 38,
    justifyContent: 'center',
    width:'100%'
  },
  button: {
    alignItems: 'center',
    flex:1,
    height:38
//      backgroundColor: '#d80024',

  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'HelveticaNeue-CondensedBold',
    backgroundColor: 'transparent',
  },
})
const chatStyles = StyleSheet.create({
  footerContainer: {
    marginTop: 5,
    marginLeft: 14,
    marginRight: 10,
    marginBottom: 10,
  }, 
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: '50%',
    top: 0,
    opacity: 1,
    backgroundColor: '#fff',
    width: width
  },  
  footerText: {
    fontSize: 14,
    color: '#aaa',
  },
});

