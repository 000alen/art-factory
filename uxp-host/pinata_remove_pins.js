[...document.getElementsByClassName("dropdown-item")]
    .filter((item) => item.innerHTML === "Delete File")
    .forEach((item, i) => {
        setTimeout(() => {
            item.click();
            setTimeout(() => {
                document.getElementsByClassName("btn btn-danger")[0].click()
            }, 100)
        }, 1000 * i)
    });