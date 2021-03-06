define([
    "helper/HostApp",
    "helper/Core",
    "helper/Paths",
    "lib/URI"
],

function(HostApp, Core, Paths, URI, Followings) {


    function Conversation() {

        Core.call(this);

        this.action = "conversation";

        this.body = document.createElement("ol");
        this.body.className = this.action;
        document.body.appendChild(this.body);
    }

    Conversation.prototype = Object.create(Core.prototype);


    Conversation.addStatus = function(status) {

        this.body.appendChild(this.getStatusDOMElement(status));
    }


    Conversation.prototype.showStatus = function(id, entity) {

        this.body.innerHTML = "";
        this.append(id, entity);
    }

    Conversation.prototype.append = function(id, entity, node, add_after) {

        var _this = this;

        var callback = function(resp) {

            var status = JSON.parse(resp.responseText);

            var dom_element = _this.getStatusDOMElement(status);

            if (node) {
                
                node.parentNode.insertBefore(dom_element, node);

            } else {
                dom_element.className = "highlight";
                _this.body.appendChild(dom_element);

                _this.appendMentioned(id, entity, dom_element);
            }


            if (status.mentions && status.mentions.length > 0 && status.mentions[0].post) {
                _this.append(status.mentions[0].post, status.mentions[0].entity, dom_element);
            }
        }

        function getRemoteStatus(profile) {
            var server = profile["https://tent.io/types/info/core/v0.1.0"].servers[0];
            Paths.getURL(URI(server + "/posts/" + id).toString(), "GET", callback, null, false);
        }


        if (entity == HostApp.stringForKey("entity")) {

            var url = URI(Paths.mkApiRootPath("/posts/" + id));
            Paths.getURL(url.toString(), "GET", callback, null);

        } else if(this.followings.followings[entity]) {

            getRemoteStatus(this.followings.followings[entity].profile);

        } else {

            Paths.findProfileURL(entity, function(profile_url) {

                if (profile_url) {

                    Paths.getURL(profile_url, "GET", function(resp) {

                        getRemoteStatus(JSON.parse(resp.responseText));

                    }, null, false); // do not send auth-headers
                }
            });
        }
    }

    Conversation.prototype.appendMentioned = function(id, entity, node) {

        var url = URI(Paths.mkApiRootPath("/posts"));
        url.addSearch("mentioned_post", id);
        url.addSearch("post_types", "https%3A%2F%2Ftent.io%2Ftypes%2Fpost%2Fstatus%2Fv0.1.0");

        var _this = this;
        var callback = function(resp) {
            
            var statuses = JSON.parse(resp.responseText);

            for (var i = 0; i < statuses.length; i++) {

                var status = statuses[i];
                var dom_element = _this.getStatusDOMElement(status);
                _this.body.appendChild(dom_element);

                _this.appendMentioned(status.id, status.entity, dom_element);
            }
        }

        Paths.getURL(url.toString(), "GET", callback);

    }

    // /posts?limit=10&mentioned_post=gnqqyt&post_types=https%3A%2F%2Ftent.io%2Ftypes%2Fpost%2Fstatus%2Fv0.1.0,https%3A%2F%2Ftent.io%2Ftypes%2Fpost%2Frepost%2Fv0.1.0 HTTP/1.1" 200 - 0.0582



    return Conversation;

});