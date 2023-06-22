// Written by Kiran Vaagen. (Vaakir) 2023
// A library or class is made with thought about future development 
// of the website. Specifically if its wanted to compare strategies 
// or graphs and the amount of graphs needed in not decided.
// It is also made in a class with the thought of staying organized.

let searchable_indicators = [
    // Main chart indicators
    {name:"SMA"        , chart: "main", c:"orange"      , p: { data: "close", period: 90 }},
    {name:"EMA"        , chart: "main", c:"cyan"        , p: { data: "close", period: 50 }},
    {name:"WMA"        , chart: "main", c:"magenta"      , p: { data: "close", period: 68 }},
    {name:"LSMA"       , chart: "main", c:"yellow"      , p: { data: "close", period: 30 }},
    {name:"SUPERTREND" , chart: "main", c:"green"       , p: { data: "all"  , period1: 20, period2: 20 }},
    {name:"HHLL"       , chart: "main", c:"brown"        , p: { data: "all"  , period1: 20, period2: 20 }},

    // Sub indicators
    {name:"RSI"        , chart: "sub" , c:"#7854B9"     , p: { data: "close", period: 14 }},
    {name:"HV"         , chart: "sub" , c:"red"         , p: { data: "close", period: 14 }},
    {name:"AROON"      , chart: "sub" , c:"cyan"        , p: { data: "all"  , period: 14 }}
]

function addAlpha(color, opacity) {
    // coerce values so it is between 0 and 1.
    var _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
}

class Indicator {
    childIndicators = []; // All the indicators stacked on top of this indicator
    parentIndicator = {};
    visible = true;
    
    constructor(id, parent, indicator_dict) {
        this.id         = id;
        this.parent     = parent;
        this.name       = indicator_dict.name;
        this.chart      = indicator_dict.chart;
        this.color      = indicator_dict.c;
        this.packet     = indicator_dict.p;
        this.init();
    }

    // ASYNC
    async init() {

        // This function adds the indicator to the graph
        // as well as displaying information about the indicator parameters on this.sideline_ol 
        // as well as adding remove and edit buttons to remove or change the indicator
        // as well as adding a overlay html for changing the indicator parameters in the GUI.
        await this.update_indicator_func_name();
        let _this   = this;
        
        // ------ Side info and overlay elements ------ //
        this.edit_buttons                    = document.createElement("div");
        this.indicator_text                  = document.createElement("div");
        this.indicator_remove_button         = document.createElement("button");
        this.indicator_edit_button           = document.createElement("button");
        this.indicator_eye_button           = document.createElement("button");
        this.indicator_sideline              = document.createElement("li");
        this.indicator_main_frame_display    = document.createElement("div");
        this.indicator_title                 = document.createElement("h3");


        this.edit_buttons.appendChild(this.indicator_remove_button);
        this.edit_buttons.appendChild(this.indicator_edit_button);
        this.edit_buttons.appendChild(this.indicator_eye_button);
        this.indicator_sideline.appendChild(this.edit_buttons);
        this.indicator_sideline.appendChild(this.indicator_text);
        this.parent.sideline_ol.appendChild(this.indicator_sideline);
        this.indicator_main_frame_display.appendChild(this.indicator_title);

        // ------ Styles (Classes, ids, styles) ------ //
        // "<img class='market' src='/static/icons/markets/"+rr['market']+".png'>
        this.indicator_remove_button.innerHTML       = "<img class='trash_button_indicator'>"; //"[X]";
        this.indicator_edit_button.innerHTML         = "[E]";
        this.indicator_eye_button.innerHTML         = "[V]";
        this.indicator_remove_button.className       = "GraphButton";
        this.indicator_edit_button.className         = "GraphButton";
        this.indicator_eye_button.className         = "GraphButton";
        this.indicator_remove_button.style.padding   = "0.5em"; // Dont ask
        this.indicator_edit_button.style.padding     = "0.5em";
        this.indicator_eye_button.style.padding     = "0.5em";
        this.indicator_text.style.padding            = "0.5em";

        // Adding the indicator to the graph
        this.parent.indicators[this.chart].push(this);


        this.indicator_text.innerHTML        = this.func_name;
        this.indicator_sideline.className    = "overlay_sideline_indicator_li"
        this.edit_buttons.style.display      = "none";


        // ------ Functionality ------ //
        this.indicator_sideline.onmouseover  = function() { _this.edit_buttons.style.display = "flex"; }
        this.indicator_sideline.onmouseleave = function() { _this.edit_buttons.style.display = "none"; }
        this.indicator_remove_button.onclick = function() { _this.remove_indicator(); }
        this.indicator_eye_button.onclick    = function() { 
            _this.visible = !_this.visible;
            if (_this.visible == false) { _this.indicator_text.className = "strikethrough"; }
            if (_this.visible == true) { _this.indicator_text.className = ""; }
            _this.parent.drawChart();
        }

        
        // Edit indicator parameters display & functionality
        let packet_datakeys = Object.keys(this.packet);
        this.indicator_title.innerHTML = this.name;
        this.source_input_box = document.createElement("select");

        // this.indicator_main_frame_display.className = "edit_indicator_frame"
        let param_div = document.createElement("div");
        param_div.className = "edit_indicator_frame";
        for (let param_input of packet_datakeys) { 
            // packet of { data: "close", period1: 69, period2: 21 }
            // -> data, period1, period2, ..

            // for the packet_datakeys
            let name_container  = document.createElement("p");
            let input_box       = document.createElement("input");

            if (param_input.includes("data")) {
                // source inputs are not numbers, but <select options>                
                name_container.innerHTML    = "source";
                input_box                   = document.createElement("select");
                let option                  = document.createElement("option");
                option.innerHTML            = "close";
                input_box.appendChild(option);

                for (let ind of this.parent.indicators.main) {
                    if (ind != this) {
                        let option       = document.createElement("option");
                        option.innerHTML = ind.func_name;
                        input_box.appendChild(option);
                    }
                }
                for (let ind of this.parent.indicators.sub) {
                    if (ind != this) {
                        let option       = document.createElement("option");
                        option.innerHTML = ind.func_name;
                        input_box.appendChild(option);
                    }
                }

            } else {
                // the input type is a number in a simple input
                name_container.innerHTML = param_input;
                input_box.innerHTML      = this.packet[param_input];
                input_box.value          = this.packet[param_input];
            }

            param_div.appendChild(name_container);
            param_div.appendChild(input_box);

            
            // input value for a parameter has changed
            input_box.onchange = async function () {
                // I AM EXTREMELY SORRY FOR THE MESS, BUT ITS ACTUALLY RLY COMPLICATED TO ADD STACKED (NESTED) INDICATORS THAT UPDATE THEIR CHILDREN
                // I COULD SIMPLIFY A LOT OF THINGS HERE, BUT THERE WAS A LACK OF TIME IN THE END, A MAJOR WATERFALL EFFECT WOULD OCCUR.
                // AND I WOULD HAVE TO FIX A LOT OF CODE TO MAKE IT SIMPLE AND EASY. I DIDN'T PLAN ON ADDING STACK INDICATORS IN THE START
                // BUT I THOUGHT IT WOULD BE A REALLY COOL FEATURE, BUT I DIDNT THINK ABOUT HOW THIS WOULD CHANGE THE STRUCTURE OF IT ALL.
                 

                // If you are editing the indicator source input data on which the indicator is being calculated on.
                // For example, you changed the source input data from the stock graph to some indicator value, 
                // making this a stacked and nested indicator.
                if (!param_input.includes("data")) {
                    // you are editing the period numbers
                    _this.packet[param_input] = parseInt(input_box.value);
                } else {

                    // packet you are editing: { data: "close", period1: 69, period2: 21 }
                    // EX: param_input : "data", so you are changing the indicator data, maybe from "close" to the values from "RSI(close,14)"

                    let indicators          = _this.parent.indicators;
                    let parent_indicator    = {};
                    let indicator_position  = "unknown";
                    let all_indicators      = Object.values(indicators);
                    for (let i=0;i<all_indicators.length;i++) {
                        let indicator_list = all_indicators[i];

                        for (let i2=0;i2<indicator_list.length;i2++) {
                            let ind = indicator_list[i2];
                            ind.subchart_index = i2;

                            // Checking to see what indicator is the father indicator, and making sure a indicator can't be 
                            // stacked on top of itself, as that makes no sense in this system.
                            if (ind.func_name == input_box.value && ind != _this) { 
                                parent_indicator = ind;

                                // (SMALL INSIGNIFICANT BUG DETECTED HERE, TWO IDENTICAL INDICATOR CLASS INSTANCES ONCHANGE TO ONE INDICATOR CHANGES THE OTHER..)
                                // EVEN THOUGH THEY HAVE DIFFERENT ID's. 
                            }
                            if (ind == _this) {
                                indicator_position = i2; 
                            }
                        }
                    }

                    _this.packet.data = input_box.value;
                    if (Object.keys(parent_indicator).length > 0 && indicator_position != "unknown") {

                        // Removing indicator from current list
                        indicators[_this.chart].splice(indicator_position, 1);

                        // Adding indicator to new list
                        _this.parentIndicator = parent_indicator;
                        parent_indicator.childIndicators.push(_this);


                        if (_this.parentIndicator.chart == "main" && _this.chart != "sub") { _this.chart = "main"; }
                        if (_this.parentIndicator.chart == "stacked") { _this.chart = "stacked"; }
                        if (_this.parentIndicator.chart == "sub" && _this.chart == "main") { _this.chart = "stacked"; }
                        indicators[_this.chart].push(_this);
                    } else {

                        // The indicator wants to be added back to the main chart
                        if (_this.chart == "stacked") {
                            indicators[_this.chart].splice(indicator_position, 1);
                            _this.chart = "main"; 
                            _this.parent.indicators.main.push(_this);

                            _this.parentIndicator.childIndicators.splice(_this.subchart_index, 1);
                        }
                        _this.parentIndicator = {};
                    }
                }
                await _this.update_indicator_func_name();    // EX: SMA(close,90) -> SMA(close,30)
                _this.indicator_text.innerHTML = _this.func_name; // Updating the canvas display name to SMA(close,30)
                _this.parent.drawChart();

            }
        }
        this.indicator_main_frame_display.appendChild(param_div);

        this.indicator_edit_button.onclick = function() {
            _this.parent.add_to_canvas_overlay_box(_this.indicator_main_frame_display); 
        }

        // 1. Re-scaling the graph heights to fit all sub charts
        // 2. Draw everything
        this.parent.scale_chart_heights();
        this.parent.drawChart();


        // DRAWING THE GRAY LINES ON TOP OF ALL SUBCHARTS THAT WILL LATER BE ADDED SCALING FUNCTIONALITY ON MOUSEDRAG
        /*this.canvas.style.position = "relative";
        let ratio_index = this.indicators.sub.length;
        let acc_Hratio = this.accumulated_Hratio(ratio_index);
        let line_y = this.canvas.height * acc_Hratio;
        let handle_bar = document.createElement("div");
        handle_bar.style = `
            z-index: 1;
            position: absolute;
            bottom: ${line_y}px;
            top: 0px;
            min-height: 7px;
            min-width: ${this.canvas.width}px;
            background-color: var(--outline_color);
        `;
        this.canvas.appendChild(handle_bar);

        handle_bar.onmouseover = function() { handle_bar.style.cursor = "row-resize"; }
        //handle_bar.ondrag = function() {
        //    console.log("aa");            
        //}
        handle_bar.onmousedown = function(e) {
            let mouse_down = _this.getMousePos(e);
            _this.mouse.down_x = mouse_down.x;
            _this.mouse.down_y = mouse_down.y;
            console.log(_this.mouse.down_y);
            handle_bar.style.bottom = `${_this.mouse.down_y}px`;
            _this.mouse.down = true;
            _this.mouse.element = handle_bar;
        }
        
        // handle_bar.onmouseup = function(e) {
        //     let mouse_up = _this.getMousePos(e);
        //     console.log(_this.mouse.down_x,_this.mouse.down_y,mouse_up);
        //     //_this.mouse.down_x = mouse_down.x;
        //     //_this.mouse.down_y = mouse_down.y;
        // }
        // mouse = {down: false, line_drawing: false, down_x:0, down_y:0, up_x:0, up_y:0};
        */
    }

    async get_indicator_values() {
        let path = this.parent.stock_data.market + "-" + this.parent.stock_data.symbol;
        let baseUrl = `/api/stockData?path=${path}&func=${this.func_name}`;
        let response;
        try { 
            response = await fetch(baseUrl, { method: 'GET' });
            response = await response.json();
            response = await response.values;
        }
        catch { response = []; console.log("Error: no stock data from get request"); }
        if (response == undefined) { response = []; }
        return response;
    }

    // Inbuildt functions
    remove_indicator() {

        // Removing the indicators stacked on this sub indicator.
        for (let ind of this.childIndicators) { ind.remove_indicator(); }

        // Removing the indicator from the parent childIndicators list
        if (Object.keys(this.parentIndicator).length > 0) {
            let index = this.parentIndicator.childIndicators.indexOf(this);
            this.parentIndicator.childIndicators.splice(index,1);
        }

        // Removing the indicator
        for (let i=0;i<this.parent.indicators[this.chart].length;i++) {
            let ind = this.parent.indicators[this.chart][i];
            if ( ind == this ) {
                this.parent.indicators[this.chart].splice(i,1);
                i = this.parent.indicators[this.chart].length;
            }
        }

        this.indicator_sideline.remove();
        if (this.chart == "sub") {
            this.parent.scale_chart_heights();
            this.parent.drawChart();
        }
    }
    async update_indicator_func_name() {
        let pack;
        if (Object.keys(this.parentIndicator).length > 0) {
            pack = Object.values(this.packet); // { data: "RSI(close,14)", period: 90 } -> ["close",90]
            pack[0] = this.parentIndicator.func_name;
        } else {
            pack = Object.values(this.packet);                         // { data: "close", period: 90 } -> ["close",90]
        }
        // console.log(this,this.func_name,pack);
    
        let reqFun          = `${this.name}(${pack.join(',')})`;                      // SMA(close,90)
        let display         = `${this.name} ${pack.slice(1,pack.length).join(',')}`;  // SMA(90)
        this.display_name   = display;
        this.func_name      = reqFun;

        // Updating the func_name, calculating the values for this
        if (this.indicator_text) { this.indicator_text.innerHTML = this.func_name; }
        this.values = await this.get_indicator_values();


        // When a indicator gets a update, all its stacked child indicators should be recursively updated as well
        if (this.childIndicators.length > 0) {
            for (let ind of this.childIndicators) {
                await ind.update_indicator_func_name();
            }
        }
    }
    static get_nested_indicators(indicator) {
        let all = [];
        if (indicator.childIndicators.length > 0) {
            for (let child of indicator.childIndicators) {
                all.push(child);
                all.push([...Indicator.get_nested_indicators(child)]);
            }
        }
        return all;
    }
    
    // Static functions
    static deepCopy(indicator) {
        return JSON.parse(JSON.stringify(indicator));
    }
}

class Canvas_graph {

    // Default values
    x       = 0;            // First time unit of graph displayed
    dx      = 50;           // Time units displayed on graph width
    o       = 0.80;         // Occupation / (margin) to top-bottom of graph
    lines   = {};           // Manual or autmatical graph lines
    close   = [];           // Closing values of the stock
    dates   = [];           // Dates for the graph
    chart_heights = [1];    // Sum of this list must always be 1 or lower
    mouse = {down: false, line_drawing: false, down_x:0, down_y:0, up_x:0, up_y:0};
    full_screen_mode = false;
    stock_data_available = false;
    theme = "Normal";
    
    constructor(id, parentElement, stock_data, indicators={main:[],sub:[],stacked:[]}, width="", height="") {
        this.id             = id;
        this.parentElement  = parentElement;
        this.stock_data     = stock_data;
        this.indicators     = indicators;
        this.width          = width;
        this.height         = height;
        this.init();
    }
    
    init() {
    
        // Building the canvas
        this.parentElement.className += " prevent-select";
        this.canvas        = document.createElement("canvas");
        this.canvas.width  = 10;
        this.canvas.height = 10;
        this.canvas.id     = this.id;
        this.ctx           = this.canvas.getContext("2d");

        // 1. (update_stock_data_values) Updating close, dates from stock_data dictionary
        // 2. (add_canvas_header_div) Adding the canvas header where people can change tickers and add indicators
        // 3. Scaling chart heights, if there were sub chart indicators sendt in.
        // 3. (-) Scaling the graph closing values length to max dates.length the first time
        this.update_stock_data_values(this.stock_data);
        this.scale_graph_width_height();
        this.add_canvas_header_div();
        this.scale_chart_heights();

        this.endIndex   = this.dates.length+this.x;
        this.dx         = this.dates.length;

        // The indicators and the closing values are easily accecible to a left-sidelined div on top of the graph.
        this.sideline_ol           = document.createElement("ol");
        this.sideline_ol.className = "overlay_sideline_ol";
        this.parentElement.appendChild(this.sideline_ol);
        this.parentElement.appendChild(this.canvas);    
        
        // Adding canvas functionality
        let temp = this;
        this.canvas.onmousedown  = function(e) { temp.mouse_down(e); }
        this.canvas.onmouseup    = function(e) { temp.mouse_up(e);   }
        this.canvas.onmousemove  = function(e) { temp.mouse_move(e); }
        this.canvas.addEventListener('wheel', function(e) {temp.on_scroll(e); }, { passive: true });
        this.parentElement.onmouseover  = function()  { temp.mouse_over();  }
        this.parentElement.onmouseleave = function()  { temp.mouse_leave(); }

        // 1. Scale chart heights distribution to decimal values 1main chart, 2 sub charts in the distribution [50%, 25%, 25%]
        // 2. Calculate saved or default indicator values
        // 3. Draw everything
        if (this.stock_data_available) {
            this.scale_chart_heights();
            this.drawChart();
        };

    }
    // GETTERS
    get yearStartPosition() {
        let last_year = parseInt( this.dates[0].split("-")[0] );
        let year_list = [];

        for (let i=0;i<this.dates.length;i++) {
            let year = parseInt( this.dates[i].split("-")[0] ); // '2013-01-01'
            if (year > last_year) {
                year_list.push({y:year,x:i});
                last_year = year;
            }
        }
        return year_list;
    }

    // ASYNC
    async calculate_indicator_values() {
        // This function gets called every time the stock data (symbol) changes.
        for (let indicator of this.indicators.main) {
            indicator.values = await indicator.get_indicator_values(indicator.func_name);
        }
        for (let indicator of this.indicators.sub) {
            indicator.values = await indicator.get_indicator_values(indicator.func_name);
        }
        for (let indicator of this.indicators.stacked) {
            indicator.values = await indicator.get_indicator_values(indicator.func_name);
        }
    }
    async update_stock_data_values(new_data) {
        try {
            this.stock_data = new_data;
            let c = new_data.Quotes.Close;
            let c_list = [];
            c.forEach(element => { c_list.push(parseFloat(element)) });
            this.close = c_list;
            
            let time2 = [];
            this.stock_data.Quotes.Time.forEach(e=>{
                // 230217 -> 2023-02-17
                let date = 20+e[0]+e[1]+"-"+e[2]+e[3]+"-"+e[4]+e[5];
                time2.push(date);
            });
            this.dates = time2;

            this.stock_data_available = true;
            await this.calculate_indicator_values();

        } catch {
            this.stock_data_available = false;
            console.log("problems getting the data into close and data format for the canvas graph");
            alert("problems getting the data into close and data format for the canvas graph");

            let body = document.getElementById("_body");
            if (body) {
                body.style.minHeight = "3em";
                this.parentElement.style.display = "none";
            }
        }
    }

    // Inbuildt functions
    search_indicator_input(input) {

        // Returning a list of the indicators matching your search
        let currN = 0;
        let limit = 9; // The limit is set as a easy solution, because we havent added a scrollbar functionality yet
        input = input.toUpperCase();
        let indicators_matching = [];
        for (let i=0;i<searchable_indicators.length;i++) {
            let indicator = searchable_indicators[i];

            if (indicator.name.includes( input ) && currN < limit) {
                currN++;
                let new_indicator = Indicator.deepCopy(indicator);
                indicators_matching.push( new_indicator );
            }
        }
        return indicators_matching;
    }
    add_to_canvas_overlay_box(overlay_div) {
        let overlay_is_new = this.canvas_overlay_box.firstElementChild != overlay_div;

        // Removing existing children to replace with new overlay div (if it is new, otherwise it should stop displaying)
        while (this.canvas_overlay_box.firstElementChild) { this.canvas_overlay_box.removeChild(this.canvas_overlay_box.lastElementChild); }

        if (overlay_is_new) { 
            this.canvas_overlay_box.appendChild(overlay_div);
            this.canvas_overlay_box.style.display = "block";
        } else {
            this.canvas_overlay_box.style.display = "none";
        }
    }
    add_canvas_header_div() {

        // This function adds the graph navigation bar, where people
        // can search up stocks and indicators and modify indicators in a canvas_overlay_box
        let temp = this;


        // ------ Overlay box elements ------  //
        this.canvas_overlay_box              = document.createElement("div");
        this.overlay_search_indicators_block = document.createElement("div");
        this.overlay_search_up_symbols_block = document.createElement("div");
        this.overlay_graph_theme_block       = document.createElement("div");

        this.indicators_search_input         = document.createElement("input");
        this.indicators_search_input_result  = document.createElement("ol");
        this.symbol_search_input             = document.createElement("input");
        this.symbol_search_input_result      = document.createElement("ol");
        this.theme_select_text               = document.createElement("p");
        this.theme_select                    = document.createElement("select");
        this.theme_option_1                  = document.createElement("option");
        this.theme_option_2                  = document.createElement("option");
        this.theme_option_3                  = document.createElement("option");

        
        this.parentElement.appendChild(this.canvas_overlay_box);
        this.overlay_search_indicators_block.appendChild(this.indicators_search_input);
        this.overlay_search_indicators_block.appendChild(this.indicators_search_input_result);
        this.overlay_search_up_symbols_block.appendChild(this.symbol_search_input);
        this.overlay_search_up_symbols_block.appendChild(this.symbol_search_input_result);
        this.overlay_graph_theme_block.appendChild(this.theme_select_text);
        this.overlay_graph_theme_block.appendChild(this.theme_select);
        this.theme_select.appendChild(this.theme_option_1);
        this.theme_select.appendChild(this.theme_option_2);
        this.theme_select.appendChild(this.theme_option_3);


        // Styles (Classes, ids, styles) (Overlay elements)
        let trans_bg_color = getComputedStyle(document.documentElement).getPropertyValue('--outline_color').split("#")[1];
        trans_bg_color = "#" + addAlpha(trans_bg_color,0.9);

        this.canvas_overlay_box.id                          = "canvas_overlay_box";
        this.canvas_overlay_box.style.display               = "none";
        this.canvas_overlay_box.style.backgroundColor       = trans_bg_color;

        this.indicators_search_input.className      = "canvas_overlay_search_input";
        this.indicators_search_input.placeholder    = "Search indicator";
        this.indicators_search_input_result.style   = `padding: 0px;`;
        this.symbol_search_input.className          = "canvas_overlay_search_input";
        this.symbol_search_input.placeholder        = "Search Symbol";
        this.symbol_search_input_result.style       = `padding: 0px;`;
        
        this.overlay_graph_theme_block.className    = "edit_indicator_frame";
        this.theme_select_text.innerHTML            = "Theme"
        this.theme_option_1.value                   = "Normal";
        this.theme_option_2.value                   = "Colored";
        this.theme_option_3.value                   = "Ghost";
        this.theme_option_1.innerHTML               = "Normal";
        this.theme_option_2.innerHTML               = "Colored";
        this.theme_option_3.innerHTML               = "Ghost";


        // Functionality (Overlay elements)
        this.indicators_search_input.oninput = function() {
            temp.indicators_search_input_result.innerHTML = "";
            let indicators_to_list_up = temp.search_indicator_input(temp.indicators_search_input.value);
            for (let indicator_data of indicators_to_list_up) {
                let li          = document.createElement("li");
                li.innerHTML    = indicator_data.name;
                li.className    = "canvas_overlay_search_li_result_elements";
                li.onclick      = function() { 
                    let id = Math.random();
                    new Indicator( id, temp, indicator_data );
                }
                temp.indicators_search_input_result.appendChild(li);
            }
        }
        async function get_tickers() {
            let q = temp.symbol_search_input.value;
            let baseUrl = "/api/query?target=tickers&q="+q+"&results_per_page=10&page=0";
            let response;
            try   { response = await fetch(baseUrl, { method: 'GET' }); } 
            catch { response = {}; console.log("Error: no stock data from get request");}
            return await response.json();
        }
        this.symbol_search_input.oninput = async function() {

            // VERY CLEAN CODE HUH? xD, time to sleep very soon yes.
            let r = await get_tickers();
            let length = Math.min(r['results'].length, 3);
            temp.symbol_search_input_result.innerHTML = "";
            for(let i=0; i<length; i++){
                let rr=r['results'][i];
                let d=document.createElement("div");
                d.onclick = function() {
                    let langu = window.location.pathname.split("/")[1];
                    window.location="/"+langu+"/"+rr['market']+"/"+rr['symbol'];
                }
                d.classList.add('tickerBoxCanvas');
                d.innerHTML="<img class='market' src='/static/icons/markets/"+rr['market']+".png'><h4>"+
                    rr['symbol']+"</h4><p>"+rr['name']+"</p><p class='sector'>"+rr['sector']+"</p>";
                temp.symbol_search_input_result.appendChild(d);
            }
        }

        // ------ Canvas header div elements ------  //
        this.can_header         = document.createElement("nav");
        this.can_header_ul      = document.createElement("ul");
        this.symbol_button      = document.createElement("button");
        this.fullscreen_button  = document.createElement("button");
        this.graph_theme_button = document.createElement("button");
        this.indicator_button   = document.createElement("button");

        this.parentElement.appendChild(this.can_header);
        this.can_header.appendChild(this.can_header_ul);
        this.can_header_ul.appendChild(this.symbol_button);
        this.can_header_ul.appendChild(this.indicator_button);
        this.can_header_ul.appendChild(this.graph_theme_button);
        this.can_header_ul.appendChild(this.fullscreen_button);


        // Styles (Classes, ids, styles) (Canvas header elements)
        this.symbol_button.innerHTML        = this.stock_data.symbol.toUpperCase();
        this.indicator_button.innerHTML     = "Indicators";
        this.graph_theme_button.innerHTML   = "Theme";
        this.fullscreen_button.innerHTML    = "Fullscreen";

        this.symbol_button.className        = "GraphButton";
        this.indicator_button.className     = "GraphButton";
        this.graph_theme_button.className   = "GraphButton";
        this.fullscreen_button.className    = "GraphButton";

        this.can_header_ul.style.margin   = "0.1em";
        this.can_header_ul.style.padding  = "0px";

        
        // Functionality (Canvas header elements)
        this.symbol_button.onclick = function() {
            temp.add_to_canvas_overlay_box(temp.overlay_search_up_symbols_block);
            temp.symbol_search_input.focus();
        }
        this.indicator_button.onclick = function() {
            temp.add_to_canvas_overlay_box(temp.overlay_search_indicators_block);
            temp.indicators_search_input.focus();
            temp.indicators_search_input.oninput();
        }
        this.fullscreen_button.onclick = function() { temp.toggle_fullscreen(); }
        this.graph_theme_button.onclick = function() {
            temp.add_to_canvas_overlay_box(temp.overlay_graph_theme_block);
            temp.theme_select.focus();
        }
        this.theme_select.onchange = function() { 
            temp.theme = temp.theme_select.value;
            temp.drawChart();
        }

    }
    scale_chart_heights() {

        // This function edits the variable this.chart_heights
        // so that the charts get their decimal value in height
        // example: [0.50, 0.25, 0.25] gives 50% to the main chart and 
        // 25% to the 2nd and 3rd sub charts. Only the M_ratio is 
        // calculated for the main chart. The sub sharts are 
        // equally distributed on the remaining space.

        let T_indic = this.indicators.sub.length;
        let T_chart = 1 + T_indic;
        let M_ratio = 2 / ( T_chart + 1 );
        let S_ratio = ( 1 - M_ratio ) / ( T_indic )

        
        // [0.5] + [0.25]*2 => [0.5,0.25,0.25]
        this.chart_heights = [M_ratio].concat(Array(T_indic).fill(S_ratio));

    }
    accumulated_Hratio(index) {
        const cutArray = this.chart_heights.slice(0, index);
        let Hratio = cutArray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return Hratio
    }
    screenX(index) {
        // Making 4% space for the price numbers to be drawned to the right
        return ( ( index - this.x ) / this.dx ) * (this.canvas.width * 0.96);
    }
    screenY(y, min, diff) {
        //  DIFF    = max-min
        //  y_dec    = ( 30 - 0 ) / 100 = 0.3
        let y_dec    = ( y - min ) / diff;
        let Hratio  = this.chart_heights[0];
        let margin  = ( 1 - this.o ) / 2;

        //  1. screenY = ( 600 - 600 * 0.3) * 0.66
        //  2. Add % offset to top and bottom by this.o
        let screenY = (this.canvas.height - this.canvas.height * y_dec) * Hratio
            screenY = screenY * this.o + this.canvas.height * Hratio * margin;

        return screenY;
    }
    screenY_SUB(y, min, diff, ratio_index=1) {
        //  DIFF    = max-min
        //  y_dec    = ( 30 - 0 ) / 100 = 0.3
        let y_dec    = ( y - min ) / diff;
        let Hratio  = this.chart_heights[ratio_index];
        let margin  = ( 1 - this.o ) / 2;
        let acc_Hratio = this.accumulated_Hratio(ratio_index);

        //  1. screenY = ( 600 - 600 * 0.3) * 0.66
        //  2. Add % offset to top and bottom by this.o
        let screenY = (this.canvas.height - this.canvas.height * y_dec) * Hratio
            screenY = screenY * this.o + this.canvas.height * Hratio * margin;
            screenY = screenY + acc_Hratio * this.canvas.height;

        return screenY;

        // return this.canvas.height-((y-min)/diff * this.canvas.height)/2;
    }
    draw_chart_values_colored(values,min, diff) {
        // The graph color is a function of the ratio between [-10, 10] compared 
        // to the adjustable baseline which is the ratio between [-10,0] which stays at 0 in bull markets
        // and drops in a bear market. The lower the color ratio is in comparioson to the baseline, the greener
        // but if the baseline is for example -9 and the color ratio is -10, then it is only possible to get a 10% green-ness color. 

        let comparison_MA = INDICATOR.MA.EMA( { data: this.stock_data, period: 50 } );
        // let comparison_MA2 = INDICATOR.MA.EMA( { data: this.stock_data, period: 10 } );
        for (let i=this.x;i<this.endIndex;i++) {

            // Math.min -> only subtracting green color in bear markets, a bigger drop is necessary to color the chart green.
            let ma_slope_ratio = Math.min(0, CALC.DECIMAL_TO_PERCENT( comparison_MA[i]/comparison_MA[i-50] )) + Math.min(0, CALC.DECIMAL_TO_PERCENT( comparison_MA[i]/comparison_MA[i-100] ));;
            ma_slope_ratio = Math.min(ma_slope_ratio,  10);
            let ma_price_ratio = CALC.DECIMAL_TO_PERCENT( values[i-1] / comparison_MA[i-1] );
            
            //let ma_price_ratio =  CALC.DECIMAL_TO_PERCENT( comparison_MA[i] / comparison_MA2[i] )*4;

            // Limiting the color ratio from between [-10, 10] %
            let ratio_p = ma_price_ratio; //- ma_slope_ratio; // Delete (- ma_slope_ratio) here
            ratio_p = Math.min(ratio_p,  10);
            ratio_p = Math.max(ratio_p, -10);
            //ratio_p -= ma_slope_ratio;                  // Add to here, if you want it to be strict instead of opportunistic
            ratio_p *= 12.6;

            // Adding the color
            if (i<52) {
                this.ctx.strokeStyle = `rgb(${255-i*2.5},${i*2.5},0)`;
            } else {
                this.ctx.strokeStyle = `rgb(${129 + ratio_p}, ${129 - ratio_p}, 0)`;
            }

            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.moveTo( this.screenX(i-1), this.screenY( values[i-1], min, diff ) );
            this.ctx.lineTo( this.screenX(i), this.screenY( values[i], min, diff ) );
            this.ctx.stroke();
        }
    }
    draw_main_chart_values(values, min, diff, color="") {
        if (color == "") {
            this.draw_chart_values_colored(values, min, diff);
        } else {
            draw.lineStart(this.ctx,color,3,false,this.theme);
            for (let i=this.x;i<this.endIndex;i++) {
                this.ctx.lineTo( this.screenX(i), this.screenY( values[i], min, diff ) );
            }
            this.ctx.stroke();
        }
    }
    draw_sub_chart_values() {

        // DRAWING SUB CHARTS
        let min     = 0;
        let max     = 100;
        let diff    = max-min;

        // let RSI = {n:"RSI",c:"green",f:INDICATOR.MOMENTUM.RSI, p: { data: curr_data, period: 14}}
        
        for (let n=0;n<this.indicators.sub.length;n++) {

            let indicator   = this.indicators.sub[n];
            let ratio_index = (n+1);

            // FOR CALCULATING THE Y_VALUE POSITION ON ANY CHART BASED ON THE MAX MIN VALUE.
            let maxmin  = this.maxmin_values(indicator);
            max         = maxmin.max;
            min         = maxmin.min;
            diff        = max-min;
            

            // DRAWING THE GRAY LINES ON TOP OF ALL SUBCHARTS THAT WILL LATER BE ADDED SCALING FUNCTIONALITY ON MOUSEDRAG
            let acc_Hratio = this.accumulated_Hratio(ratio_index);
            let line_y = this.canvas.height * acc_Hratio;
            draw.line(this.ctx,0,line_y,this.canvas.width,line_y,'rgba(255,255,255,0.1',5,false,this.theme);

            let scaler = (min + diff); // Sometimes the oscillator isn't between positive values
            let lines  = [0.3*scaler,0.5*scaler,0.7*scaler]; // 3 STANDARD LINES FOR OSCILLATORS

            // DRAWING PURPLE BACKGROUND
            if (indicator.name == "RSI") {
                lines = [20,30,40,50,60,70,80];

                let ex_margin  = 0.5+this.o/2 // 1-(1-x)/2 => 0.5+x/2
                let upper_line = 70;
                let lower_line = 30;
                if (upper_line > max*ex_margin) { upper_line = max; }
                if (lower_line < min-(diff*ex_margin)) { lower_line = min; }

                let purple_box_height = this.screenY_SUB(upper_line, min, max, ratio_index) - this.screenY_SUB(lower_line, min, max, ratio_index);
                draw.rect(this.ctx, 0, this.screenY_SUB(lower_line, min, max, ratio_index), this.canvas.width, purple_box_height, '#222136');
            }

            // DRAWING SUB CHART LINES AND VALUES ON THE Y - AXIS
            this.ctx.fillStyle = "white";        
            for (let i=0;i<lines.length;i++) {
                let l = lines[i];
                let thisY = this.screenY_SUB(l, min, max, ratio_index);
                if (max > l && l > min) {
                    draw.line(this.ctx,0,thisY,this.canvas.width,thisY,'rgba(255,255,255,0.1',1,false,this.theme);
                    this.ctx.fillText(`${l}`, this.canvas.width*0.96, thisY);
                }
            }

            
            // DRAWING THE SUB CHART VALUES
            if (indicator.visible) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = indicator.color;
                for (let i=this.x;i<this.endIndex;i++) {
                    let thisX = this.screenX(i);
                    let thisY = this.screenY_SUB(indicator.values[i], min, diff,ratio_index);
                    this.ctx.lineTo(thisX,thisY);
                }
                this.ctx.stroke();
            }

            // DRAWING THE STACKED SUB CHART VALUES OF THIS INDICATOR
            // THEY ARE STORED IN THE CHILDINDICATORS
            let all_nested_indicators = Indicator.get_nested_indicators(indicator);
            for (let nested_indicator of all_nested_indicators) {
                
                // THEY ARE EITHER STACKED OR SUB INDICATORS THAT CANT BE DRAWN ON TOP OF OTHER SUB INDICATORS
                if (nested_indicator.chart == "stacked" && nested_indicator.visible) {

                    // DRAWING THE NESTED SUB CHART VALUES
                    this.ctx.strokeStyle = nested_indicator.color;
                    this.ctx.beginPath();
                    for (let i=this.x;i<this.endIndex;i++) {
                        let thisX = this.screenX(i);
                        let thisY = this.screenY_SUB(nested_indicator.values[i], min, diff, ratio_index);
                        this.ctx.lineTo(thisX,thisY);
                    }
                    this.ctx.stroke();
                }

            }

        }

        /*
        // DRAWING THE STACKED SUB CHART VALUES
        for (let n=0;n<this.indicators.stacked.length;n++) {

            let indicator   = this.indicators.stacked[n];
            let ratio_index = indicator.subchart_index+1;

            // FOR CALCULATING THE Y_VALUE POSITION ON ANY CHART BASED ON THE MAX MIN VALUE.
            let maxmin  = this.maxmin_values(indicator);
            max         = maxmin.max;
            min         = maxmin.min;
            diff        = max-min;

            console.log(indicator,ratio_index,maxmin);


            // WE STILL DRAW LINES FOR THE INDICATORS IF THEY ARE SUBCHARTS
            // DRAWING PURPLE BACKGROUND
            if (indicator.name == "RSI") {
                lines = [20,30,40,50,60,70,80];
                let purple_box_height = this.screenY_SUB(70, min, max, ratio_index) - this.screenY_SUB(30, min, max, ratio_index);
                draw.rect(this.ctx, 0, this.screenY_SUB(30, min, max, ratio_index), this.canvas.width, purple_box_height, '#222136');
            }
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = indicator.color; // '#7854B9';
            for (let i=this.x;i<this.endIndex;i++) {
                let thisX = this.screenX(i);
                let thisY = this.screenY_SUB(indicator.values[i], min, diff, ratio_index);
                this.ctx.lineTo(thisX,thisY);
            }
            this.ctx.stroke();
        }
        */
    }
    drawChart() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.endIndex   = this.dx + this.x;
        let minMaxArr   = this.maxmin_values();
        let min         = minMaxArr.min;
        let max         = minMaxArr.max;
        let diff        = max-min;
        
        // DRAW CANVAS BACKGROUND, DEFINE COLORS
        let website_background = getComputedStyle(document.documentElement).getPropertyValue('--main_background');
        let website_text_color = getComputedStyle(document.documentElement).getPropertyValue('--text_color');
        draw.rect(this.ctx,0,0,this.canvas.width,this.canvas.height, website_background);
        

        // DRAW PRICE LINES
        this.ctx.fillStyle = website_text_color;
        let values_printed = 10;
        let increment = (max-min)/values_printed;
        for (let i=0;i<values_printed;i++) {

            let y    = CALC.DES(min + increment*i,2);
            let posy = this.screenY( y, min, diff );

            draw.line(this.ctx,0,posy,this.canvas.width*0.96,posy,"rgba(255,255,255,0.1)",1,false,this.theme);
            this.ctx.fillText(`${y}`, this.canvas.width*0.96, posy);
        }

        // DRAWING MAIN CHART
        if      (this.theme == "Normal")    { this.draw_main_chart_values(this.close, min, diff, "#0B90FF"); }
        else if (this.theme == "Colored")   { this.draw_main_chart_values(this.close, min, diff, ""); } 
        else if (this.theme == "Ghost")     { this.draw_main_chart_values(this.close, min, diff, "silver"); }
        for (let indicator of this.indicators.main) {
            if (indicator.visible) {
                this.draw_main_chart_values(indicator.values, min, diff, indicator.color);
            }
        }

        // DRAWING SUB CHARTS
        this.draw_sub_chart_values();

        // DRAW DATES - THAT ARE NOT STACKED ON TOP OF EACH OTHER
        this.ctx.font = "14px Arial";
        let index_plus                  = 1;
        let dates                       = this.yearStartPosition;
        let newTemporaryDatesList       = dates.filter(item => (item.x > this.x && item.x < this.endIndex));
        let final_display_width         = this.width * this.close.length / this.dx;
        let space_to_draw               = final_display_width / (newTemporaryDatesList.length * 4 * 14); // dates.length * dates.charlength * 14px

        if (space_to_draw < 1) {
            index_plus = Math.ceil(1/space_to_draw); 
        }
        for (let i=dates.length-1;i>0;i-=index_plus) {
            this.ctx.fillStyle = website_text_color;
            let date    = dates[i];
            let thisX   = this.screenX(date.x);

            // The lines should not cross the price numbers to the right.
            if (thisX < this.canvas.width*0.96) {
                this.ctx.fillText(date.y, thisX, this.canvas.height*0.99);
                draw.line(this.ctx,thisX,0,thisX,this.canvas.height,"rgba(255,255,255,0.1)",1,false,this.theme);
            }
        }

        // MANUALLY DRAWNED LINES ON CANVAS
        /* for (let i=0;i<this.additional_line.length;i++) {
            let l = this.additional_line[i];
            draw.line(this.ctx,l.x,l.y,l.dx,l.dy,'white',1,false,this.theme);
        }*/
    }
    get_nested_values(indicator,start,end) {
        let all_values = [];
        if (indicator == "") {

            // Maxmin of the main chart is requested
            all_values = this.close.slice(start,end);
            for (let ind of this.indicators.main) {
                all_values = all_values.concat(this.get_nested_values(ind,start,end));
            }
        } else {
            // Maxmin of a indicator is requested
            all_values = all_values.concat( indicator.values.slice(start,end) );
            if (indicator.childIndicators.length > 0) {
                for (let child of indicator.childIndicators) {
                    all_values = all_values.concat(this.get_nested_values(child,start,end));
                }
            }
        }
        return all_values;
    }
    maxmin_values(indicator="") {
        let start   = Math.max(0,this.x);
        let end     = this.endIndex;
        let min     = Infinity;
        let max     = 0;
        let y_vals  = this.get_nested_values(indicator,start,end);
        
        // console.log(y_vals);
        for (let i=0;i<y_vals.length;i++) {
            if ( y_vals[i] > max ) { max = y_vals[i]; }
            if ( y_vals[i] < min ) { min = y_vals[i]; }
        }
        return {min:min,max:max};
    }
    getMousePos(evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    scale_graph_width_height() {
        // This function automatically gets called on window resizing

    
        let canvas_height = window.innerHeight*0.7;

        // if this doesn't exist, now it will.
        if (!this.height_before) { this.height_before = canvas_height;}

        if (this.full_screen_mode) {
            this.sideline_ol.style.left = "5%";
            this.width = window.innerHeight*0.9;
            this.height = window.innerWidth*0.9;
            this.canvas.width = window.innerWidth*0.9;
            this.canvas.height = window.innerHeight*0.9;
        } else {
            this.width = window.innerWidth*0.7;
            this.height = this.height_before;
            this.canvas.width = window.innerWidth*0.7;
            this.canvas.height = this.height_before;
            
            setTimeout(()=> {
                this.sideline_ol.style.left = "15%";
            }, 10);
        }
        if (this.stock_data_available) { this.drawChart(); }
    }
    toggle_fullscreen() {

        this.full_screen_mode = !this.full_screen_mode;
        if ( this.full_screen_mode == true ) {
            // this.canvas_overlay_box.style.transform = "translate(150%)";
            let main = document.getElementsByTagName("main")[0];
            if (main.requestFullscreen) {
                main.requestFullscreen();
            } else if (main.webkitRequestFullscreen) { /* Safari */
                main.webkitRequestFullscreen();
            } else if (main.msRequestFullscreen) { /* IE11 */
                main.msRequestFullscreen();
            }
        } else {
            // this.canvas_overlay_box.style.transform = "translate(150%)";
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }

    }
    mouse_down(event) {
        this.mouse.down = true; 
        let m = this.getMousePos(event);
        this.mouse.down_x = m.x;
        this.mouse.down_y = m.y;

        this.canvas_overlay_box.style.display = "none";
    }
    mouse_up(event) {
        this.mouse.down = false;
        let m = this.getMousePos(event);
        this.mouse.up_x = m.x;
        this.mouse.up_y = m.y;

        if (!this.line_drawing_saved && this.active_line_drawing) {
            additional_line.push({ 
                x: mouse.down_x, 
                y: mouse.down_y, 
                dx: mouse.up_x, 
                dy: mouse.up_y 
            });
        }
    }
    mouse_move(event) {

        // I can beautify this when I have the time for it.
        if (this.stock_data_available) {
            if (this.mouse.down) {
                let m = this.getMousePos(event);
    
                if (!this.active_line_drawing) {
                    let close_data = this.close.length;//Object.values(curr_data['close']).length;
                    let minChange = this.canvas.width / this.dx;
            
                    let change = (this.mouse.down_x - m.x);
                    let change_times = Math.round((Math.abs(change)/minChange));

                    let change_number = this.x + (Math.sign(change) * change_times) + this.dx;
                    if (Math.abs(change) > minChange && 10 < change_number && change_number < (close_data*2 - 10)) {
                        this.mouse.down_x -= minChange * Math.sign(change) * change_times;
                        this.x += Math.sign(change) * change_times;
                    }

                    this.drawChart();
                } else {
                    let line = {
                        x: mouse.down_x,
                        y: mouse.down_y,
                        dx: m.x,
                        dy: m.y,
                    };
                    this.drawChart();
                    draw.line(this.ctx,line.x,line.y,line.dx,line.dy,'orange',1,false,this.theme);
                }
                
                if ( this.mouse.element ) {
                    this.mouse.element.style.bottom = `${(this.mouse.down_y - m.y) + this.mouse.down_y}px`;
                }   
            }

            // Should be drawn on a seperate canvas overlaying this so we dont have to re-draw the prices all the time
            // Would be fixed if we got the time for it, typical waterfall effect when you dont plan ahead :shrugs:, oh well.
            // Alternative solutions because of crap load of redoing of work -> overlay divs on the canvas - might be easier to implement
            let m = this.getMousePos(event);
            this.drawChart();
            draw.line(this.ctx,0,m.y,this.canvas.width,m.y,'white',0.5,true,this.theme);
            draw.line(this.ctx,m.x,0,m.x,this.canvas.height,'white',0.5,true,this.theme);
        }
    }
    on_scroll(event) {
        if (this.stock_data_available) {
            let change = Math.round( Math.sign(event.wheelDelta) * this.dx*0.1 );
            let new_dx = this.dx - change;

            if (new_dx > 10 && new_dx < this.close.length*3) {

                if (this.x < (this.close.length + 5)) { this.x += change; }
                if (this.x > (this.close.length - 5)) { this.x = this.close.length-5; }

                this.dx -= change;
                this.drawChart();
            }
        }
    }
    mouse_over() {
        document.body.style.overflow='hidden';

        // (DisableScroll) Get the current page scroll position
        //let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        //let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        //// if any scroll is attempted, set this to the previous value
        //window.onscroll = function() {
        //    window.scrollTo(scrollLeft, scrollTop);
        //};
    }
    mouse_leave() {
        // window.onscroll = function() {};

        document.body.style.overflowY='scroll';
        this.mouse.down = false;
        
        if (this.stock_data_available) { this.drawChart(); }
    }
}