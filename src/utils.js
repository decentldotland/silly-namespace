import axios from "axios";

const SILLY_FUNC_ADDR = `Rhn7YAuDFeZDAW53LJKKfHWPpcggxB2LX92ylVrTPvw`; 

async function getState() {
  try {
    return (
      await axios.get(`https://api.mem.tech/api/state/${SILLY_FUNC_ADDR}`)
    )?.data;
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function resolveDomain(domain) {
  try {
    const domains = (await getState())?.domains;
    const normalizedDomain = domain.normalize("NFKC");

    const resolved = domains.find((usr) => usr.domain == normalizedDomain);

    if (resolved) {
      return resolved;
    }

    return {};
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function resolveAddr(addr) {
  try {
    const domains = (await getState())?.domains;

    const resolved = domains.find(
      (usr) => usr.owner.toLowerCase() == addr.toLowerCase() && usr.is_primary,
    );

    if (resolved) {
      return resolved;
    }

    return {};
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function getAllDomains(addr) {
  try {
    const domains = (await getState())?.domains;

    const resolved = domains.filter(
      (usr) => usr.owner.toLowerCase() == addr.toLowerCase(),
    );

    if (resolved) {
      return resolved;
    }

    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
}
