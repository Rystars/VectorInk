class EventEmitter{
    constructor(){
        this._events = {}
    }

    on(action, listener){
        
        if(!this._events.hasOwnProperty(action)){
            this._events[action] = [];
        }

        //var listener = this.listener(action);
        this._events[action].push(listener);
        return listener;
    }
    emit(action, props){
        if(!this._events.hasOwnProperty(action)){
            return;
        }

        for(var i = 0; i < this._events[action].length; i++){
            //this._events[i].callback(props || {});
            if(typeof this._events[action][i] == 'function'){
                this._events[action][i](typeof props == 'undefined' ? null : props);
            }
            else{
                console.log('FAILED to fire event on non-function', action, i, this._events[action][i])
            }
        }
    }
    listener(action){
        return {
            id: $util.id(action),
            action: action,
            callback: function(){},
            do: (listener) => {
                this.callback = listener;
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = new EventEmitter()
}
else{
    window.EventEmitter = EventEmitter
}
    