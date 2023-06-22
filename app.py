#region import
from flask import Flask, render_template, request, redirect, url_for, g, make_response
import json
from random import randrange
import datetime
import os.path

from backtesting_engine.indicator import *
from leaked_pwds import leaked_pwds_list
import analyze
#endregion

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

#region language
def attempt_get_language(lang='en'):
    path='lang/'+lang+'.json'
    if not os.path.exists(path):
        path='lang/en.json'
    lang=json.load(open(path, encoding="utf-8"))
    return lang
#endregion

#region webpage routes
# a quick and easy way to make routes:
def Route(url,request,lang='en'):
    session=get_session(request)
    return render_template(url+".html",
        lang=attempt_get_language(lang),
        in_session=session[0],
        session=session[1])

@app.route("/about")
def setabouttings():
    return Route('about',request)
@app.route("/<lang>/about")
def about_lang(lang):
    return Route('about',request,lang)

@app.route("/settings")
def settings():
    return Route('settings',request)
@app.route("/<lang>/settings")
def settings_lang(lang):
    return Route('settings',request,lang)

# found it more convenient to write out the <market> as two different routes.
@app.route("/osebx/<stock>")
def view_stock_osebx(stock):
    return Route('stock_view',request)
@app.route("/<lang>/osebx/<stock>")
def view_stock_osebx_lang(lang,stock):
    return Route('stock_view',request,lang)
@app.route("/nyse/<stock>")
def view_stock_nyse(stock):
    return Route('stock_view',request)
@app.route("/<lang>/nyse/<stock>")
def view_stock_nyse_lang(lang,stock):
    return Route('stock_view',request,lang)

@app.route("/login")
def login():
    return Route('login',request)
@app.route("/<lang>/login")
def login_lang(lang):
    return Route('login',request,lang)

@app.route("/register")
def register():
    return Route('register',request)
@app.route("/<lang>/register")
def register_lang(lang):
    return Route('register',request,lang)

@app.route("/")
def index():
    return redirect('/en')
@app.route("/<lang>")
def index_lang(lang):
    return Route('index',request,lang)

@app.route("/safari")
def safari():
    return Route('safari',request)
@app.route("/<lang>/safari")
def safari_lang(lang):
    return Route('safari',request,lang)

@app.route("/user/<id>")
def user(id):
    return Route('view_user',request)
@app.route("/<lang>/user/<id>")
def user_lang(lang,id):
    return Route('view_user',request,lang)

@app.errorhandler(404)
def http_error_handler(error):
    return Route('page_doesnt_exist',request)

#endregion

#region stock API endpoints
@app.route("/api/quotes")
def api_quotes():
    n=60
    datapath = request.args.get("path", None).split('-') # api/stockData?path=nyse-eqnr
    if len(datapath)==1:
        return json.dumps("what")
    market   = datapath[0]
    symbol   = datapath[1]
    path='data/stocks/'+market+'/'+symbol.upper()+'.json'
    obj={'Price':[],'time':[]}
    if os.path.exists(path):
        try:
            table=json.load(open(path))
        except:
            return json.dumps("uhhhh skip")
        if 'Quotes' in table:
            table['Quotes']['Close']=table['Quotes']['Close'][-n:]
            table['Quotes']['Time']=table['Quotes']['Time'][-n:]
            #table['Quotes']['Close']=table['Quotes']['Volume'][-n:]
            return json.dumps(table['Quotes'])
        else:
            return json.dumps(obj)

    return json.dumps(obj)

@app.route("/api/latest/<target>")
def api_latest(target):
    datapath = request.args.get("path", "all")
    if not (target in ['prices','predictions']):
        return json.dumps([])
    path='data/latest/'+target+'.json'
    table=json.load(open(path))

    if datapath!='all':
        for i in range(len(table)):
            if table[i]['symbol']==datapath:
                table=table[i]
                break

    currency=request.args.get('currency','NOK')
    if currency.upper()=='NOK':
        return json.dumps(table)
    else:
        currency=float(table[currency.upper()])
        
        return json.dumps(price/currency for price in table)

@app.route("/api/query")
def api_query():
    target=request.args.get('target').lower()
    if not target in ['tickers', 'users']:
        return json.dumps('naughty naughty you')
    obj=json.load(open('data/'+target+'.json'))
    
    limit=request.args.get('limit','none')
    if limit=='all':
        if target=="users":
            return obj["public_users"]
    
    perPage=request.args.get('results_per_page')
    page=request.args.get('page')

    q=request.args.get('q')
    if not q:
        try:
            perPage=int(perPage)
            page=int(page)
            startIdx=perPage*page
            return json.dumps({'results':obj[startIdx:startIdx+perPage]})
        except:
            return json.dumps({'results':obj})
    q=q.lower()
    results=[r for r in obj if q in (r['name']+' '+r['symbol']+' '+r['sector']).lower().replace('_unknown','')]
    try:
        perPage=int(perPage)
        page=int(page)
    except:
        return json.dumps(None)
    startIdx=perPage*page
    return json.dumps({'results':results[startIdx:startIdx+perPage]})


# Indicator_values has to be global for the server to accept it.
# get stock data from stock .json list
# use: api/stockData?path=nyse-eqnr
indicator_values = []
@app.route("/api/stockData", methods=["GET"])
def api_getStockdata():

    # Example inputs:
    # request.args -> ImmutableMultiDict([('path='NFLX')])
    # request.args -> ImmutableMultiDict([('path='NFLX'), ('func', 'EMA(SMA(close, 10),10)')])
    datapath = request.args.get("path", None).split('-')
    market   = datapath[0]
    symbol   = datapath[1]
    if symbol:
        path            = 'data/stocks/'+market+'/'+symbol+'.json'
        stock_data      = []
        all             = []
        if os.path.exists(path):
            file_opened     = open(path)
            table           = json.load(file_opened)
            all             = table
            table['symbol'] = symbol # attaching the symbol to the sendt data. Strictly speaking not necessary, since name attribute is already in data object :) 
            table['market'] = market # attaching the market to the sendt data
            stock_data      = json.dumps(table)
            file_opened.close()
            
            # Indicator values for the stock is requested
            if len(request.args) == 2:
                func_name = request.args.get("func", None)

                try:
                    # Client activation = await Canvas_graph.get_indicator_values("NFLX","EMA(SMA(close, 10),10)");
                    # input : symbol    = NFLX
                    # input : func_name = EMA(SMA(close, 10),10)

                    close = all["Quotes"]["Close"]

                    codeObject = compile("global indicator_values; indicator_values =" + func_name, 'code_string', 'exec')
                    exec(codeObject)

                    return json.dumps({"values":indicator_values})
                    
                except:
                    print("---------------------------------------------------------")
                    print("Problem occured, could not find indicator data from input")
                    print("------------> request  : ",request.args)
                    print("------------> func_name: ",func_name)

                    return json.dumps("{'err':'Problem occured, could not find indicator data from input'}")
            
            # Only stock data is requested
            return stock_data
    return json.dumps("{'err':'Invalid input sendt to server'}")

# get stock data
@app.route("/api/about/<market>/<id>")
def api_about(market,id):
    if not get_session(request)[0]: return make_response(json.dumps("not allowed lol"),401)
    market=market.lower()
    if market in ['nyse','osebx']:
        id=id.upper()
        path='data/stocks/'+market+'/'+id+'.json'
        if os.path.exists(path):
            stock=json.load(open(path))
            tickers=json.load(open('data/tickers.json'))
            nordnet_id='_unknown_'
            name=''
            for ticker in tickers:
                if ticker['market']!=market: continue
                if ticker['symbol']==id:
                    if 'nordnet id' in ticker:
                        nordnet_id=ticker['nordnet id']
                    name=ticker['name']
                    break
            if 'Quotes' in stock:
                del stock['Quotes'] #no need to send big payload
            stock['nordnet_id']=nordnet_id
            stock['name']=name
            stock['analysis']=analyze.analyze_stock(id,market)
            return json.dumps(stock)
    return json.dumps(None)

#endregion

#region analysis API endpoints

# supports api/analyze/eqnr and api/analyze/portfolio.
# portfolio analysis only works for logged in users and returns the average of the stocks included in the portfolio.
@app.route("/api/analyze/<obj>")
def api_analyze(obj):
    s=get_session(request)
    if(s[1]['id']=='0000000'): return json.dumps('None')
    if obj=='portfolio':
        if not s[0]: return json.dumps('None')
        userid=s[1]['id']
        users=json.load(open('data/users.json'))
        for user in users['public_users']:
            if user['userid']==userid:
                return json.dumps(analyze.analyze_portfolio(user['public_data']['portfolio']))

    else:
        return analyze.analyze_stock(obj)
    return json.dumps(None)

# /api/get/DividendsMS?path=EQNR-osebx or drop the path to get all upcoming dividends :)
# use /api/der/Quotes to get the latest changes
# use /api/getder/Quotes to get both the latest price and the change
#''' these methods should only run when needed! they are very resource heavy. Use api/latest instead (baked version of this)
@app.route("/api/get/<column_name>")
def api_get_column_of(column_name):
    datapath = request.args.get("path", "all").split('-')
    return analyze.get_column(datapath, column_name)
@app.route("/api/der/<column_name>")
def api_get_derivated_column_of(column_name):
    datapath = request.args.get("path", "all").split('-')
    return analyze.get_der_column(datapath, column_name)


@app.route("/api/getder/<column_name>")
def api_get_combined_column_of(column_name):
    datapath = request.args.get("path", "all").split('-')
    return analyze.get_der_and_latest_column(datapath, column_name)
#'''
#endregion

#region user API endpoints

# iterates over all users until requested user id is found
def get_user(userid):
    users=json.load(open('data/users.json'))
    for user in users['public_users']:
        if user['userid']==userid:
            return user
    for user in users['private_users']:
        if user['userid']==userid:
            return user

# authenticate a user and create a new session
@app.route("/api/auth", methods=['POST'])
def api_auth():
    data=request.get_json()
    u=data['username']
    p=data['password']
    if not u or not p:
        return make_response(json.dumps({'successful':'false','errMsg':'Please enter your credentials.'}),400)
    u=u.lower()
    users=json.load(open('data/users.json'))
    for user in users['public_users']:
        if user['public_data']['username'].lower()==u and user['password']==p:
            if user['access_level']<0:
                return make_response(json.dumps({'successful':'false','errMsg':'User is banned.'}),401)
            session_id=random_session_id()
            expire_date = datetime.datetime.now()
            expire_date = expire_date + datetime.timedelta(days=1)
            active_sessions[session_id]={'access_level':user['access_level'], 'id':user['userid'],'expires':expire_date}
            response=make_response(json.dumps({'successful':'true'}),200)
            response.set_cookie('session_id', session_id,expires=expire_date) #secure=True, httponly=True
            return response
        
    for user in users['private_users']:
        if user['username'].lower()==u and user['password']==p:
            session_id=random_session_id()
            expire_date = datetime.datetime.now()
            expire_date = expire_date + datetime.timedelta(days=1)
            active_sessions[session_id]={'access_level':user['access_level'],'id':user['userid'],'expires':expire_date}
            response=make_response(json.dumps({'successful':'true'}),200)
            response.set_cookie('session_id', session_id,expires=expire_date) #secure=True, httponly=True
            return response
    return make_response(json.dumps({'successful':'false','errMsg':'Bad credentials.'}),400)

# close the session
@app.route("/api/logout")
def api_logout():
    session=request.cookies.get('session_id')
    if session and session in active_sessions:
        del active_sessions[session]
    response=make_response(redirect('/login'))
    response.set_cookie('session_id', '',expires=0) #secure=True, httponly=True
    return response
# get users portfolio
@app.route("/api/portfolio",methods=['GET'])
def portfolio_get():
    s=get_session(request)
    obj=json.load(open('data/users.json'))
    if not s[0]:
        return json.dumps(None)
    userid=s[1]['id']
    for user in obj['public_users']:
        if user['userid']==userid:
            return json.dumps(user['public_data']['portfolio'])
    return  json.dumps(None)
# edit users portfolio and update users.json
@app.route("/api/portfolio",methods=['POST'])
def portfolio_post():
    s=get_session(request)
    j=request.get_json()
    symbol=j['symbol']
    if symbol.lower()=='cash':
        symbol=symbol.lower()
    else:
        symbol=symbol.split(':') # EQNR:osebx
        if len(symbol)==1: symbol=symbol[0].upper()+':osebx'
        else: symbol=symbol[0].upper()+':'+symbol[1]
    amount=j['amount']
    obj=json.load(open('data/users.json'))
    if not s[0] or not symbol or not amount:
        return json.dumps({"msg":f"Session or symbol {symbol} or amount {amount} invalid"})
    try:
        amount=int(amount)
    except:
        return json.dumps(None)
    userid=s[1]['id']
    new_portfolio=None
    foundUser=False
    for i in range(len(obj['public_users'])):
        if obj['public_users'][i]['userid']==userid:
            if amount==0:
                del obj['public_users'][i]['public_data']['portfolio'] [symbol]
            else:
                obj['public_users'][i]['public_data']['portfolio'] [symbol]=amount
            foundUser=True
            new_portfolio=obj['public_users'][i]['public_data']['portfolio']
            break
    if foundUser:
        with open("data/users.json", "w") as outfile:
            outfile.write(json.dumps(obj))
        return json.dumps({"msg":"Success","portfolio":new_portfolio})
    else:
        return json.dumps({"msg":f"Failed {userid}"})
# make a new user and append to users.json
@app.route("/api/user", methods=['POST'])
def api_register():
    data=request.get_json()
    u=data['username']
    if u and is_profane(u):
        return make_response(json.dumps({'successful':'false','errMsg':'No naughty words.'}),400)
    p=data['password']
    if not u or not p:
        return make_response(json.dumps({'successful':'false','errMsg':'Invalid credentials.'}),400)
    users=json.load(open('data/users.json'))
    
    userid=0
    for i in range(1000):
        userid=randrange(0,100000000)
        useridTaken=False
        for user in users['public_users']:
            if user['userid']==userid:
                useridTaken=True
                break
        if not useridTaken: break
    # create a blank user, with all the necessary json tags
    user={
        "public_data": {"username": u, "portfolio": {"cash": 0}, "safari_level": 0, "safari_bets_correct": 0, "safari_bets_incorrect": 0},
        "userid": userid,
        "password": p,
        "access_level":1
    }
    
    users['public_users'].append(user)
    
    with open("data/users.json", "w") as f:
        f.write(json.dumps(users))

    session_id=random_session_id()
    expire_date = datetime.datetime.now()
    expire_date = expire_date + datetime.timedelta(days=1)
    active_sessions[session_id]={'id':userid,'expires':expire_date,'access_level':1}
    response=make_response(json.dumps({'successful':'true'}),200)
    response.set_cookie('session_id', session_id,expires=expire_date) #secure=True, httponly=True
    return response
# check if password quality is sufficient for new users
@app.route("/api/pwd_quality",methods=['POST'])
def api_pwd():
    results={}
    level=5
    data=request.get_json()
    pwd=data['pwd']
    conditions=[1,1,1,1,1]
    if not pwd:
        return json.dumps({'level':0,'conditions':[0,0,0,0,0]})
    
    #enforce long passwords
    if len(pwd)<10: 
        level-=1
        conditions[0]=0
    #include both upper- and lowercase
    if pwd.lower()==pwd or pwd.upper()==pwd:
        level-=1
        conditions[1]=0
    #include digits
    if not any(char.isdigit() for char in pwd):
        level-=1
        conditions[2]=0
    #include symbols
    if not any(char in '.,_!?@#*^´~<>()[]' for char in pwd):
        level-=1
        conditions[3]=0
    #leaked passwords soft ban list
    if pwd.lower() in leaked_pwds_list:
        level=0
        conditions[4]=0


    return json.dumps({'level':level,'conditions':conditions})
# check if username exists in users.json
@app.route("/api/username_available",methods=['POST'])
def api_check_username():
    data=request.get_json()
    username=data['username']
    if not username or 'admin' in username.lower() or 'moderator' in username.lower(): #we dont want 100 admins running about
        return json.dumps({'available':-2})
    
    users=json.load(open('data/users.json'))
    for user in users['public_users']:
        # because each user has a seperate id, we dont need to worry about uppercase/lowercase :)
        if user['public_data']['username']==username:
            return json.dumps({'available':0})
    return json.dumps({'available':1})
# make a new post
@app.route("/api/post",methods=['POST'])
def make_post():
    s=get_session(request)
    obj=json.load(open('data/social/posts.json'))
    if not s[0]:
        return json.dumps('Please log in to make a post.')
    
    j=request.get_json()
    body=j['body']
    if is_profane(body):
        return json.dumps(None)
    tags=j['tags']
    for i in range(len(tags)):
        tags[i]=tags[i].lower()
    tag=j['tag'] #the sites tag, for selecting the posts to send back
    time=datetime.datetime.now().strftime("%m/%d/%Y")
    userid=s[1]['id']
    username='anonymous user'
    users=json.load(open('data/users.json'))
    user=get_user(userid)
    if user: username=user['public_data']['username']
    pid=int(obj[0]['pid'])+1
    obj.insert(0,{'tags':tags,'time':time,'pid':pid,'uid':userid, 'author':username, 'body':body})
    
    with open("data/social/posts.json", "w") as outfile:
        outfile.write(json.dumps(obj))
    return filter_posts(obj,tag)
# delete post
@app.route("/api/post/<tag>/<pid>",methods=['DELETE'])
def delete_post(tag,pid):
    s=get_session(request)
    posts=json.load(open('data/social/posts.json'))
    if not s[0]:
        return json.dumps('Please log in to delete your post.')
    
    for i in range(len(posts)):
        if not 'pid' in posts[i]: continue
        if int(posts[i]['pid'])==int(pid) and ( tag in posts[i]['tags'] or tag=='all'):
            del posts[i]
            break
    
    with open("data/social/posts.json", "w") as outfile:
        outfile.write(json.dumps(posts))

    return filter_posts(posts,tag)
# get all posts with a given tag
@app.route("/api/post/<tag>",methods=['GET'])
def get_posts(tag):
    obj=json.load(open('data/social/posts.json'))
    return filter_posts(obj,tag)
# only return posts with a given tag
def filter_posts(obj,tag):
    posts=[]
    tag=tag.lower()
    for post in obj:
        if tag in post['tags'] or tag=='all':
            posts.append(post)
            if len(posts)>=7: break
    return json.dumps(posts)  

    
# get user public data
@app.route("/api/about/user/<uid>")
def api_about_user(uid):
    obj=json.load(open('data/users.json'))
    q=get_session(request)
    if uid=='self':
        if not q[0]:
            return json.dumps(None)
        uid=q[1]['id']
    try:
        uid=int(uid)
    except:
        print("cry")
        return json.dumps('user id must be an integer!')
    for user in obj['public_users']:
        if user['userid']==uid:
            user['public_data']['id']=uid
            return json.dumps(user['public_data'])
    return  json.dumps(None)

# change user details
@app.route("/api/user", methods=['PUT'])
def api_update_details():
    s=get_session(request)
    if not s:
        return make_response(json.dumps({'successful':'false','errMsg':'User needs to log in to update details.'}),400)
    data=request.get_json()
    u=None
    if 'username' in data:
        u=data['username']
        if is_profane(u):
            return make_response(json.dumps({'successful':'false','errMsg':'Username not allowed.'}),400)

    p=None
    if 'password' in data: p=data['password']
    if not u and not p:
        return make_response(json.dumps({'successful':'false','errMsg':'Please enter username or password to update.'}),400)
    users=json.load(open('data/users.json'))
    
    userFound=False
    for user in users['public_users']:
        if user['userid']==s[1]['id']:
            userFound=True
            if u:
                user['public_data']['username']=u
            if p:
                user['password']=p
            break
    if not userFound:
        return make_response(json.dumps({'successful':'false','errMsg':'User does not exist or session is corrupt.'}),400)
    
    with open("data/users.json", "w") as f:
        f.write(json.dumps(users))

    response=make_response(json.dumps({'successful':'true'}),200)
    return response

# delete a user entirely (posts not included!)
@app.route("/api/delete_user/<uid>", methods=['GET'])
def api_delete_user(uid):
    try:
        uid=int(uid)
    except:
        return make_response(json.dumps({'successful':'false','errMsg':'User id has to be integer!'}),400)
    s=get_session(request)
    if not s[0] or s[1]['access_level']<3:
        return make_response(json.dumps({'successful':'false','errMsg':'Login as admin to delete users.'}),400)
    
    users=json.load(open('data/users.json'))
    
    userFound=False
    for user in users['public_users']:
        if user['userid']==uid:
            users["public_users"].remove(user)
            userFound=True
            break
    if not userFound:
        return make_response(json.dumps({'successful':'false','errMsg':'User does not exist.'}),400)
    
    with open("data/users.json", "w") as f:
        f.write(json.dumps(users))

    return make_response(json.dumps({'successful':'true'}),200)


# ban a user
@app.route("/api/ban/<uid>", methods=['GET'])
def api_ban_user(uid):
    try:
        uid=int(uid)
    except:
        return make_response(json.dumps({'successful':'false','errMsg':'User id has to be integer!'}),400)
    s=get_session(request)
    if not s[0] or s[1]['access_level']<3:
        return make_response(json.dumps({'successful':'false','errMsg':'Login as admin to ban users.'}),400)
    
    users=json.load(open('data/users.json'))
    
    userFound=False
    for user in users['public_users']:
        if user['userid']==uid:
            user['access_level']=-1
            userFound=True
            break
    if not userFound:
        return make_response(json.dumps({'successful':'false','errMsg':'User does not exist.'}),400)
    
    with open("data/users.json", "w") as f:
        f.write(json.dumps(users))

    return make_response(json.dumps({'successful':'true'}),200)

#endregion

#region safari game API endpoints

# add to users score if request is marked correct, otherwise subtract from score
@app.route("/api/safari/update")
def api_safari_update():
    s=get_session(request)
    correct=request.args.get('correct')
    obj=json.load(open('data/users.json'))
    if not s[0] or not correct:
        return make_response(json.dumps(None),403)
    userid=s[1]['id']
    for i in range(len(obj['public_users'])):
        if obj['public_users'][i]['userid']==userid:
            obj['public_users'][i]['public_data']['safari_level']+=1 if correct=='true' else 0
            if correct=='true':
                obj['public_users'][i]['public_data']['safari_bets_correct']+=1
            else:
                obj['public_users'][i]['public_data']['safari_bets_incorrect']+=1
                
            with open("data/users.json", "w") as outfile:
                outfile.write(json.dumps(obj))
            return make_response(json.dumps({"level":obj['public_users'][i]['public_data']['safari_level']}),200)
    return make_response(json.dumps(None),403)
# get active users safari stats
@app.route("/api/safari/stats")
def api_safari_stats():
    s=get_session(request)
    if not s[0]:
        return make_response(json.dumps(None),403)
    obj=json.load(open('data/users.json'))
    userid=s[1]['id']
    for i in range(len(obj['public_users'])):
        if obj['public_users'][i]['userid']==userid:
            return make_response(json.dumps({
                "level":obj['public_users'][i]['public_data']['safari_level'],
                "correct":obj['public_users'][i]['public_data']['safari_bets_correct'],
                "incorrect":obj['public_users'][i]['public_data']['safari_bets_incorrect']
            }),200)
    return make_response(json.dumps(None),403)

#endregion

#region create session
active_sessions={}
def get_session(request):
    session_id=request.cookies.get('session_id')
    if session_id in active_sessions:
        if datetime.datetime.now()>active_sessions[session_id]['expires']:
            del active_sessions[session_id]
            return False,'expired'
        else:
            return True,active_sessions[session_id]
    else:
        return False,{'access_level':0,'id':0}
    
def random_session_id():
    session_id=''
    ls='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890---_.'
    for i in range(200):
        session_id+=ls[randrange(0,len(ls))]
    return session_id
#endregion

def is_profane(s):
    s=s.lower()
    profanity_filter=["<",">","script","fuc","damn","negro","nigger","ass","sex","suck",
                      "penis","blowjob","blow job","boob","butt","whore","cum","jerk","pedo",
                      "phile","shit","caucasian"]
    for p in profanity_filter:
        if p in s: return True
        if p.replace('i','!') in s:return True
        if p.replace('s','$') in s:return True
        if p.replace('i','!').replace('s','$') in s:return True
        if p.replace('e','€') in s:return True
        if p.replace('e','€').replace('s','$') in s:return True
    return False


if __name__ == "__main__":
    app.run(debug=True)