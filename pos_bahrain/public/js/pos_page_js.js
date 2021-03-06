erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
	set_primary_action: function () {
                var me = this;
                this.page.set_primary_action(__("New Cart"), function () {
                        me.make_new_cart()
                        me.make_menu_list()
                }, "fa fa-plus")

                if (this.frm.doc.docstatus == 1 || this.pos_profile_data["allow_print_before_pay"]) {
                        this.page.set_secondary_action(__("Print"), function () {
                                me.create_invoice();
                                var html = frappe.render(me.print_template_data, me.frm.doc)
                                me.print_document(html)
                        })
                }

                if (this.frm.doc.docstatus == 1) {
                        this.page.add_menu_item(__("Email"), function () {
                                me.email_prompt()
                        })
                }

                this.page.add_menu_item(__("Opening Cash"), function () {
                        var opening_voucher = frappe.model.get_new_doc('Opening Cash');
                        opening_voucher.pos_profile = me.pos_profile_data.name;


                        opening_voucher.cashier = frappe.session.user;
                        opening_voucher.date = me.frm.doc.posting_date;

                        opening_voucher.pos_profile = me.pos_profile_data.name;

                        frappe.set_route('Form', 'Opening Cash', opening_voucher.name);
                })

                if (this.frm.doc.docstatus == 0){
                        this.page.set_secondary_action(__("Closing Voucher"), function () {
                                var voucher = frappe.model.get_new_doc('POS Closing Voucher');
                                voucher.pos_profile = me.pos_profile_data.name;
				
				          voucher.user = frappe.session.user;
                                voucher.company = me.frm.doc.company;
                                voucher.period_start_date = me.frm.doc.posting_date;
                                voucher.period_end_date = me.frm.doc.posting_date;
                                voucher.posting_date = me.frm.doc.posting_date;
                                frappe.set_route('Form', 'POS Closing Voucher', voucher.name);
                        })
                }
        },
	refresh_fields: function (update_paid_amount) {
                this.apply_pricing_rule();
                this.discount_amount_applied = false;
                this._calculate_taxes_and_totals();
                this.calculate_discount_amount();
                this.show_items_in_item_cart();
                this.set_taxes();
                this.calculate_outstanding_amount(update_paid_amount);
                this.set_totals();
                this.update_total_qty();
        },
	update_total_qty: function() {
                var me = this;
                var qty_total = 0;
                        $.each(this.frm.doc["items"] || [], function (i, d) {
                                if (d.item_code) {
                                        qty_total += d.qty;
                                }
                        });
                this.frm.doc.qty_total = qty_total;
                this.wrapper.find('.qty-total').text(this.frm.doc.qty_total);
        },
	create_invoice: function () {
                var me = this;
                var invoice_data = {};
                this.si_docs = this.get_doc_from_localstorage();
                if (this.frm.doc.offline_pos_name) {
                        this.update_invoice();
                } else {
                        this.frm.doc.offline_pos_name = $.now();
                        this.frm.doc.posting_date = frappe.datetime.get_today();
                        this.frm.doc.posting_time = frappe.datetime.now_time();
                        this.frm.doc.pos_total_qty = this.frm.doc.qty_total;
                        this.frm.doc.pos_profile = this.pos_profile_data['name'];
                        invoice_data[this.frm.doc.offline_pos_name] = this.frm.doc;
                        this.si_docs.push(invoice_data);
                        this.update_localstorage();
                        this.set_primary_action();
                }
                return invoice_data;
        },
	make_control: function() {
		this.frm = {}
		this.frm.doc = this.doc
		this.set_transaction_defaults("Customer");
		this.frm.doc["allow_user_to_edit_rate"] = this.pos_profile_data["allow_user_to_edit_rate"] ? true : false;
		this.frm.doc["allow_user_to_edit_discount"] = this.pos_profile_data["allow_user_to_edit_discount"] ? true : false;
		this.wrapper.html(frappe.render_template("pos_bahrain", this.frm.doc));
		this.make_search();
		this.make_customer();
		this.make_list_customers();
		this.bind_numeric_keypad();
	},


})
		
