$(function() {
    $('form').submit(function(e) {
        e.preventDefault();
        $.post('/login', {
            username: $("#inputUsername").val(),
            password: $("#inputPassword").val()
        }, function(response) {
            if (!response) {
                $.notify({
                    icon: "ti-face-sad",
                    message: "Error! Unknown username or password."

                }, {
                    type: "danger",
                    timer: 3000,
                    placement: {
                        from: "top",
                        align: "right"
                    }
                });
            }  else if(response) window.location.href = "/"
        })
    })
})
