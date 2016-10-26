import React from 'react';

class ChatDisplay extends React.Component {
  render() {
    return (<div>{this.renderMessages(this.props.messages)}</div>);
  }

  renderMessages(messages) {
    return messages.map((message, index) => (
      <div>
        <strong>{message.dname}</strong>
        <p>{message.message}</p>
      </div>
    ));
  }
}

ChatDisplay.propTypes = {
  messages: React.PropTypes.array.isRequired
}

class ChatSubmitThing extends React.Component {
  render() {
    return (<div><input value="chat somethign" /></div>)
  }
}

class ChatWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {messages: []}
  }

  componentDidMount() {
    const channel = this.context.pusher.subscribe("panoptes-chat");
    channel.bind('message', (data) => {
      this.setState({messages: this.state.messages.concat([data])});
    })
  }

  componentWillUnmount() {
    this.context.pusher.unsubscribe('panoptes-chat');
  }

  render () {
    return (
      <div>
        <ChatDisplay messages={this.state.messages} />
        <ChatSubmitThing />
      </div>
    )
  }
}

ChatWindow.contextTypes = {
  pusher: React.PropTypes.object.isRequired
}

module.exports = ChatWindow
