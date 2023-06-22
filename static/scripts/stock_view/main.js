// SITE FUNCTIONS
class site_func {
    static async init() {
        let symbol      = site_func.get_current_symbol();
        let market      = site_func.get_current_market();
        let stock_data  = await site_func.get_stock_data(symbol,market)
        let canvas_id   = "canvasGfx";
        let parent_el   = document.getElementById("canvas_position");
        window.canvas   = new Canvas_graph(canvas_id,parent_el,stock_data);
        window.addEventListener("resize", function() { window.canvas.scale_graph_width_height(); });
    }
    static get_current_symbol() {
        let symbol;
        let url_paths=window.location.href.split("?")[0].split("/");
        try   { symbol = url_paths[url_paths.length-1]; } // split by '/' gives: (0)http://(2)www.koji.com/(3)market/(4)symbol
        catch { symbol = "AAPL"; console.warn("Symbol not found!"); }
        return symbol;
    }
    static get_current_market() {
        let market;
        let url_paths=window.location.href.split("?")[0].split("/");
        try   { market = url_paths[url_paths.length-2]; }
        catch { console.warn("Market not found!"); market = "osebx"; }
        return market;
    }

    static async get_stock_data(symbol,market) {
        let baseUrl = '/api/stockData?path='+market+'-'+symbol;
        let response;
        try   { response = await fetch(baseUrl, { method: 'GET' }); } 
        catch { response = {}; console.log("Error: no stock data from get request");}
        return await response.json();
    }
}

site_func.init();



// This will be heavily edited and added to the site as soon as possible
class block_manager {
    CONDITION_BLOCK_LIST    = ["CROSSES_ABOVE","CROSSES_BELOW","IS_ABOVE","IS_BELOW","IS_EQUAL_TO"];
    CONTINUE_BLOCK_LIST     = ["AND","OR"];
    CONDITION_END_BLOCK_LIST= ["TOP","BOTTOM","MOVING_UPWARDS","MOVING_DOWNWARDS"];
    INDICATOR_BLOCK_LIST    = ["NUMBER","SMA","RSI","ETC.."];

    
}
