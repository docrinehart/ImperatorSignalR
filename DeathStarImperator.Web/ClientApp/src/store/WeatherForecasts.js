import * as signalR from '@aspnet/signalr';

const requestWeatherForecastsType = 'REQUEST_WEATHER_FORECASTS';
const receiveWeatherForecastsType = 'RECEIVE_WEATHER_FORECASTS';
const initialState = {
  forecasts: [],
  isLoading: false,
  hubConnection: null,
  nickname: ''
};

export const actionCreators = {
  requestWeatherForecasts: startDateIndex => async (dispatch, getState) => {
    if (startDateIndex === getState().weatherForecasts.startDateIndex) {
      // Don't issue a duplicate request (we already have or are loading the requested data)
      return;
    }

    dispatch({ type: requestWeatherForecastsType, startDateIndex });

    const url = `api/SampleData/WeatherForecasts?startDateIndex=${startDateIndex}`;
    const response = await fetch(url);
    const forecasts = await response.json();

    dispatch({ type: receiveWeatherForecastsType, startDateIndex, forecasts });
  },

  connectToHub: nickname => async (dispatch, getState) => {
    let state = getState();
    
    console.log(state);

    if (state.hubConnection != null) {
      console.log('Connection exists...');
      return;
    }

    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/testHub')
      .configureLogging(signalR.LogLevel.Information)
      .build();

    dispatch({ type: 'SET_CONNECTION', hubConnection, nickname });

    hubConnection
      .start()
      .then(() => {
        console.log('Connection started!');
        hubConnection.invoke("SendMessage", "userTest", "I am a test message. YEY!");
      })
      .catch(err => console.log('Error while establishing connection :('));
    
    hubConnection.on('receiveMessage', (nick, receivedMessage) => {
      const text = `${nick}: ${receivedMessage}`;
      //const messages = this.state.messages.concat([text]);
      console.log(text);
      //console.log(messages.length)
      //this.setState({ messages });
    });

    //hubConnection.
  },

  disconnectHub: () => async (dispatch, getState) => {
    console.log("disconnecting");
    let state = getState();
    
    console.log(state);

    state.weatherForecasts.hubConnection.stop();
  }
};

export const reducer = (state, action) => {
  state = state || initialState;

  if (action.type === 'SET_CONNECTION') {
    return {
      ...state,
      hubConnection: action.hubConnection,
      nickname: action.nickname
    }
  }

  if (action.type === requestWeatherForecastsType) {
    return {
      ...state,
      startDateIndex: action.startDateIndex,
      isLoading: true
    };
  }

  if (action.type === receiveWeatherForecastsType) {
    return {
      ...state,
      startDateIndex: action.startDateIndex,
      forecasts: action.forecasts,
      isLoading: false
    };
  }

  return state;
};
