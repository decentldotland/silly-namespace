export async function handle(state, action) {
  const input = action.input;

  if (input.function === "mint") {
    const { caller, sig, domain, tx_fee } = input;

    _notPaused();

    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    const normalized_domain = _validateDomain(domain);
    const normalized_caller = caller.toLowerCase();
    const caller_index = state.domains.findIndex(
      (domain) => domain.owner === normalized_caller,
    );
    await _validatePayment(normalized_domain, tx_fee, caller);

    // assign primary domain
    if (caller_index === -1) {
      state.domains.push({
        owner: normalized_caller,
        domain: normalized_domain,
        is_primary: true,
      });

      return { state };
    }

    state.domains.push({
      owner: normalized_caller,
      domain: normalized_domain,
      is_primary: false,
    });

    return { state };
  }

  if (input.function === "setPrimaryDomain") {
    const { caller, sig, domain } = input;

    _notPaused();

    const normalized_domain = _handleDomainSyntax(domain);
    const normalized_caller = caller.toLowerCase();
    const domain_index = state.domains.findIndex(
      (user) =>
        user.domain === normalized_domain && user.owner === normalized_caller,
    );
    const old_domain_index = state.domains.findIndex(
      (user) => user.is_primary && user.owner === normalized_caller,
    );
    ContractAssert(domain_index !== -1, "ERROR_UNAUTHORIZED_CALLER");

    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    state.domains[domain_index].is_primary = true;

    if (old_domain_index !== -1) {
      state.domains[old_domain_index].is_primary = false;
    }

    return { state };
  }

  if (input.function === "transfer") {
    const { caller, sig, domain, target } = input;

    _notPaused();

    const normalized_domain = _handleDomainSyntax(domain);
    const normalized_caller = caller.toLowerCase();
    // _validateEoaSyntax(target);
    const normalized_target = target.toLowerCase();

    const domainIndex = state.domains.findIndex(
      (user) =>
        user.domain === normalized_domain && user.owner === normalized_caller,
    );
    ContractAssert(domainIndex !== -1, "ERROR_DOMAIN_NOT_FOUND");

    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    ContractAssert(!state.domains[domainIndex].is_tradeable, "ERR_NOT_TRANSFERABLE");

    if (state.domains[domainIndex].is_primary) {
      state.domains[domainIndex].is_primary = false;
    }

    state.domains[domainIndex].owner = normalized_target;

    return { state };
  }

  if (input.function === "sellDomain") {
    const { caller, sig, domain, ask_price } = input;

    _notPaused();

    const normalized_domain = _handleDomainSyntax(domain);
    const normalized_caller = caller.toLowerCase();
    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    const domainIndex = state.domains.findIndex(
      (user) =>
        user.domain === normalized_domain && user.owner === normalized_caller,
    );

    ContractAssert(domainIndex !== -1, "ERROR_DOMAIN_NOT_FOUND");
    ContractAssert(Number.isInteger(ask_price) && ask_price > 0, "ERR_INVALID_SELL_PRICE");

    if (state.domains[domainIndex].is_primary) {
      state.domains[domainIndex].is_primary = false;
    }

    state.domains[domainIndex].is_tradeable = true;
    state.domains[domainIndex].ask_price = ask_price;
    state.domains[domainIndex].order_id = SmartWeave.transaction.id;

    return { state };
  }

  if (input.function === "buyDomain") {
    const { caller, sig, domain, payment_txid } = input;
    
    _notPaused();
    
    const normalized_caller = caller.toLowerCase();
    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    const domainIndex = state.domains.findIndex(
      (user) =>
        user.domain === normalized_domain && user.owner === normalized_caller,
    );

    ContractAssert(domainIndex !== -1, "ERROR_DOMAIN_NOT_FOUND");
    const targetDomain = state.domains[domainIndex];

    ContractAssert(targetDomain.owner !== caller, "ERR_INVALID_CALLER");
    ContractAssert(targetDomain.is_tradeable, "ERR_DOMAIN_NOT_TRADEABLE");

    await _validateTransfer(payment_txid, caller, targetDomain.owner, targetDomain.ask_price);

    state.domains[domainIndex].owner = caller;
    state.domains[domainIndex].is_tradeable = false;
    delete state.domains[domainIndex].ask_price;
    delete state.domains[domainIndex].order_id;

    return { state };
  }

  if (input.function === "cancelOrder") {
    const { order_id, caller, sig } = input;

    const normalized_caller = caller.toLowerCase();
    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(caller, encodedMessage, sig);

    const domainIndex = state.domains.findIndex((domain) => domain.order_id === order_id && domain.is_tradeable && domain.owner === caller);
    ContractAssert(domainIndex > -1, "ERR_ORDER_NOT_FOUND");

    state.domains[domainIndex].is_tradeable = false;
    delete state.domains[domainIndex].ask_price;
    delete state.domains[domainIndex].order_id;

    return { state };

  }

  // ADMIN FUNCTIONS

  if (input.function === "pauseUnpauseContract") {
    const { sig } = input;

    const encodedMessage = btoa(`${state.sig_message}${state.counter}`);
    await _moleculeSignatureVerification(
      state.admin_address,
      encodedMessage,
      sig,
    );

    const status = state.isPaused;
    state.isPaused = !status;

    return { state };
  }

  function _notPaused() {
    ContractAssert(!state.isPaused, "ERROR_CONTRACT_PAUSED");
  }

  function _validateDomain(domain) {
    const normalized = domain.trim().toLowerCase().normalize("NFKC");
    ContractAssert(
      /^[a-z0-9]+$/.test(normalized),
      "ERROR_INVALID_DOMAIN_SYNTAX",
    );
    ContractAssert(
      !state.domains.map((user) => user.domain).includes(normalized),
      "ERROR_DOMAIN_MINTED",
    );
    return normalized;
  }

  function _handleDomainSyntax(domain) {
    const normalized = domain.trim().toLowerCase().normalize("NFKC");
    ContractAssert(
      /^[a-z0-9]+$/.test(normalized),
      "ERROR_INVALID_DOMAIN_SYNTAX",
    );
    return normalized;
  }

  function _validateEoaSyntax(address) {
    ContractAssert(
      /^(0x)?[0-9a-fA-F]{40}$/.test(address),
      "ERROR_INVALID_EOA_ADDR",
    );
  }

  async function _moleculeSignatureVerification(caller, message, signature) {
    try {
      ContractAssert(
        !state.signatures.includes(signature),
        "ERROR_SIGNATURE_ALREADY_USED",
      );

      const isValid = await EXM.deterministicFetch(
        `${state.molecules.sig}/${caller}/${message}/${signature}`,
      );
      ContractAssert(isValid.asJSON()?.result, "ERROR_UNAUTHORIZED_CALLER");
      state.signatures.push(signature);
      state.counter += 1;
    } catch (error) {
      throw new ContractError("ERROR_MOLECULE.SH_CONNECTION");
    }
  }

  function _getDomainType(domain) {
    return `l${domain.length}`;
  }

  async function _validatePayment(domain, txid, from) {
    try {
      ContractAssert(!state.payments.includes(txid), "ERROR_DOUBLE_SPENDING");

      const domainType = _getDomainType(domain);
      const cost = state.pricing[domainType];
      const tx = (await EXM.deterministicFetch(
        `${state.molecules.spl}/${txid}/${state.token_contract}/${state.treasury_address}/${from}`,
      ))?.asJSON();

      ContractAssert(tx[state.treasury_address] >= cost, "ERR_INVALID_PAYMENT");
      ContractAssert(tx[state.treasury_address] > tx[from], "ERR_INVALID_PAYMENT");
      ContractAssert(tx.token_address === state.token_contract, "ERR_INVALID_PAYMENT");

      state.payments.push(txid);
    } catch (error) {
      throw new ContractError("ERROR_MOLECULE_SERVER_ERROR");
    }
  }

  async function _validateTransfer(txid, from, target, amount) {
    try {
      ContractAssert(!state.payments.includes(txid), "ERROR_DOUBLE_SPENDING");

      const tx = (await EXM.deterministicFetch(
        `${state.molecules.spl}/${txid}/${state.token_contract}/${target}/${from}`,
      ))?.asJSON();

      ContractAssert(tx[target] >= amount, "ERR_INVALID_PAYMENT");
      ContractAssert(tx[target] > tx[from], "ERR_INVALID_PAYMENT");
      ContractAssert(tx.token_address === state.token_contract, "ERR_INVALID_PAYMENT");

      state.payments.push(txid);
    } catch (error) {
      throw new ContractError("ERROR_MOLECULE_SERVER_ERROR");
    }
  }

}