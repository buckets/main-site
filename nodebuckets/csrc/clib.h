/* Generated by Nim Compiler v0.19.1 */
/*   (c) 2017 Andreas Rumpf */
/* The generated code is subject to the original license. */
#ifndef __clib__
#define __clib__
#define NIM_NEW_MANGLING_RULES
#define NIM_INTBITS 64

#include "nimbase.h"
#undef LANGUAGE_C
#undef MIPSEB
#undef MIPSEL
#undef PPC
#undef R3000
#undef R4000
#undef i386
#undef linux
#undef mips
#undef near
#undef far
#undef powerpc
#undef unix
typedef N_CDECL_PTR(void, tyProc_5cp59bim9aJ4WupX5aVaD1Sg) (NCSTRING msg);
N_NOCONV(void, signalHandler)(int sign);
N_NIMCALL(NI, getRefcount)(void* p);
N_NIMCALL(NCSTRING, buckets_version)(void);
N_NIMCALL(NCSTRING, buckets_stringpc)(NCSTRING command, NCSTRING arg, NI arglen);
N_NIMCALL(void, buckets_register_logger)(tyProc_5cp59bim9aJ4WupX5aVaD1Sg fn);
N_NIMCALL(NI, buckets_openfile)(NCSTRING filename);
N_NIMCALL(NCSTRING, buckets_db_all_json)(NI budget_handle, NCSTRING query, NCSTRING params_json);
N_NIMCALL(NCSTRING, buckets_db_run_json)(NI budget_handle, NCSTRING query, NCSTRING params_json);
N_NIMCALL(NCSTRING, buckets_db_execute_many_json)(NI budget_handle, NCSTRING queries_json);
N_CDECL(void, NimMain)(void);
#endif /* __clib__ */
