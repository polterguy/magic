    this.[[column-name]] = new FormControl('');
    this.[[column-name]].valueChanges
      .pipe(debounceTime(this.debounce), distinctUntilChanged())
      .subscribe(query => {
        this.paginator.pageIndex = 0;
        this.filter.offset = 0;
        this.hasFiltered = true;
        this.filter['[[column-name]].like'] = this.[[column-name]].value + '%';
        this.getData();
      });
