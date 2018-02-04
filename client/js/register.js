$(function() {
    $('form').submit(function(e){
        e.preventDefault();
        $.post('/api/register', {
            username: $("#inputUsername").val(),
            password: $("#inputPassword").val(),
            firstname: $("#inputFname").val(),
            lastname: $("#inputLname").val(),
            email: $("#inputFname").val()
        }, function(response){
            if(!response)  alert("ERRRORRRR" + response)
            else if(response) window.location.href = "/login"
        })
    })
})